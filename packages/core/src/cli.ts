/**
 * @fileoverview Main CLI object.
 * @author Nicholas C. Zakas
 */

"use strict";

/*
 * NOTE: The CLI object should *not* call process.exit() directly. It should only return
 * exit codes. This allows other programs to use the CLI object and still control
 * when the program exits.
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { promisify } from "util";

import { Legacy } from "@eslint/eslintrc";
import { ModuleImporter } from "@humanwhocodes/module-importer";
import Debug from "debug";

import { ESLint } from "./eslint";
import { ESLintOptions } from "./eslint/eslint";
import { FlatESLint, findFlatConfigFile } from "./eslint/flat-eslint";
import createCLIOptions from "./options";
import log from "./shared/logging";
import * as RuntimeInfo from "./shared/runtime-info";
import { LintMessage, LintResult, ResultsMeta, EnvsMap, GlobalsMap, Plugin } from "./shared/types";
import { ParsedCLIOptions } from "./types";

const debug = Debug("eslint:cli");
const { naming } = Legacy;

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

/** @typedef {import("./eslint/eslint").ESLintOptions} ESLintOptions */
/** @typedef {import("./eslint/eslint").LintMessage} LintMessage */
/** @typedef {import("./eslint/eslint").LintResult} LintResult */
/** @typedef {import("./options").ParsedCLIOptions} ParsedCLIOptions */
/** @typedef {import("./shared/types").ResultsMeta} ResultsMeta */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const writeFile = promisify(fs.writeFile);

/**
 * Predicate function for whether or not to apply fixes in quiet mode.
 * If a message is a warning, do not apply a fix.
 * @param {LintMessage} message The lint result.
 * @returns {boolean} True if the lint message is an error (and thus should be
 * auto fixed), false otherwise.
 */
function quietFixPredicate(message: LintMessage) {
    return message.severity === 2;
}

/**
 * Translates the CLI options into the options expected by the ESLint constructor.
 * @param {ParsedCLIOptions} cliOptions The CLI options to translate.
 * @param {"flat"|"eslintrc"} [configType="eslintrc"] The format of the
 *      config to generate.
 * @returns {Promise<ESLintOptions>} The options object for the ESLint constructor.
 * @private
 */
async function translateOptions(cliOptions: ParsedCLIOptions, configType: "flat" | "eslintrc" = "eslintrc") {
    const {
        cache,
        cacheFile,
        cacheLocation,
        cacheStrategy,
        config,
        configLookup,
        env,
        errorOnUnmatchedPattern,
        eslintrc,
        ext,
        fix,
        fixDryRun,
        fixType,
        global,
        ignore,
        ignorePath,
        ignorePattern,
        inlineConfig,
        parser,
        parserOptions,
        plugin,
        quiet,
        reportUnusedDisableDirectives,
        resolvePluginsRelativeTo,
        rule,
        rulesdir
    } = cliOptions;
    let overrideConfig: any, overrideConfigFile;
    const importer = new ModuleImporter();

    if (configType === "flat") {
        overrideConfigFile = typeof config === "string" ? config : !configLookup;
        if (overrideConfigFile === false) {
            overrideConfigFile = void 0;
        }

        let globals: GlobalsMap = {};

        if (global) {
            globals = global.reduce((obj, name) => {
                if (name.endsWith(":true")) {
                    obj[name.slice(0, -5)] = "writable";
                } else {
                    obj[name] = "readonly";
                }
                return obj;
            }, globals);
        }

        overrideConfig = [
            {
                languageOptions: {
                    globals,
                    parserOptions: parserOptions || {}
                },
                rules: rule ? rule : {}
            }
        ];

        if (parser) {
            overrideConfig[0].languageOptions.parser = await importer.import(parser);
        }

        if (plugin) {
            const plugins: Record<string, Plugin> = {};

            for (const pluginName of plugin) {
                const shortName = naming.getShorthandName(pluginName, "eslint-plugin");
                const longName = naming.normalizePackageName(pluginName, "eslint-plugin");

                plugins[shortName] = await importer.import(longName);
            }

            overrideConfig[0].plugins = plugins;
        }
    } else {
        overrideConfigFile = config;

        overrideConfig = {
            env:
                env &&
                env.reduce<EnvsMap>((obj, name) => {
                    obj[name] = true;
                    return obj;
                }, {}),
            globals:
                global &&
                global.reduce<GlobalsMap>((obj, name) => {
                    if (name.endsWith(":true")) {
                        obj[name.slice(0, -5)] = "writable";
                    } else {
                        obj[name] = "readonly";
                    }
                    return obj;
                }, {}),
            ignorePatterns: ignorePattern,
            parser,
            parserOptions,
            plugins: plugin,
            rules: rule
        };
    }

    const options: ESLintOptions = {
        allowInlineConfig: inlineConfig,
        cache,
        cacheLocation: cacheLocation || cacheFile,
        cacheStrategy,
        errorOnUnmatchedPattern,
        fix: (fix || fixDryRun) && (quiet ? quietFixPredicate : true),
        fixTypes: fixType,
        // @ts-expect-error
        ignore,
        overrideConfig,
        // @ts-expect-error
        overrideConfigFile,
        reportUnusedDisableDirectives: reportUnusedDisableDirectives ? "error" : void 0
    };

    if (configType === "flat") {
        // @ts-expect-error
        options.ignorePatterns = ignorePattern;
    } else {
        options.resolvePluginsRelativeTo = resolvePluginsRelativeTo;
        options.rulePaths = rulesdir;
        options.useEslintrc = eslintrc;
        options.extensions = ext;
        options.ignorePath = ignorePath;
    }

    return options;
}

/**
 * Count error messages.
 * @param {LintResult[]} results The lint results.
 * @returns {{errorCount:number;fatalErrorCount:number,warningCount:number}} The number of error messages.
 */
function countErrors(results: LintResult[]) {
    let errorCount = 0;
    let fatalErrorCount = 0;
    let warningCount = 0;

    for (const result of results) {
        errorCount += result.errorCount;
        fatalErrorCount += result.fatalErrorCount;
        warningCount += result.warningCount;
    }

    return { errorCount, fatalErrorCount, warningCount };
}

/**
 * Check if a given file path is a directory or not.
 * @param {string} filePath The path to a file to check.
 * @returns {Promise<boolean>} `true` if the given path is a directory.
 */
async function isDirectory(filePath: string) {
    try {
        return (await stat(filePath)).isDirectory();
    } catch (error: any) {
        if (error.code === "ENOENT" || error.code === "ENOTDIR") {
            return false;
        }
        throw error;
    }
}

/**
 * Outputs the results of the linting.
 * @param {ESLint} engine The ESLint instance to use.
 * @param {LintResult[]} results The results to print.
 * @param {string} format The name of the formatter to use or the path to the formatter.
 * @param {string} outputFile The path for the output file.
 * @param {ResultsMeta} resultsMeta Warning count and max threshold.
 * @returns {Promise<boolean>} True if the printing succeeds, false if not.
 * @private
 */
async function printResults(engine: ESLint, results: LintResult[], format: string, outputFile: string, resultsMeta: ResultsMeta) {
    let formatter;

    try {
        formatter = await engine.loadFormatter(format);
    } catch (e: any) {
        log.error(e.message);
        return false;
    }

    const output = await formatter.format(results, resultsMeta);

    if (output) {
        if (outputFile) {
            const filePath = path.resolve(process.cwd(), outputFile);

            if (await isDirectory(filePath)) {
                log.error("Cannot write to output file path, it is a directory: %s", outputFile);
                return false;
            }

            try {
                await mkdir(path.dirname(filePath), { recursive: true });
                await writeFile(filePath, output);
            } catch (ex) {
                log.error("There was a problem writing the output file:\n%s", ex);
                return false;
            }
        } else {
            log.info(output);
        }
    }

    return true;
}

/**
 * Returns whether flat config should be used.
 * @param {boolean} [allowFlatConfig] Whether or not to allow flat config.
 * @returns {Promise<boolean>} Where flat config should be used.
 */
async function shouldUseFlatConfig(allowFlatConfig?: boolean) {
    if (!allowFlatConfig) {
        return false;
    }

    console.log("process", process.env.ESLINT_USE_FLAT_CONFIG);
    switch (process.env.ESLINT_USE_FLAT_CONFIG) {
        case "true":
            return true;
        case "false":
            return false;
        default:
            /*
             * If neither explicitly enabled nor disabled, then use the presence
             * of a flat config file to determine enablement.
             */
            console.log("@@@", await findFlatConfigFile(process.cwd()));
            return !!(await findFlatConfigFile(process.cwd()));
    }
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * Encapsulates all CLI behavior for eslint. Makes it easier to test as well as
 * for other Node.js programs to effectively run the CLI.
 */
const cli = {
    /**
     * Executes the CLI based on an array of arguments that is passed in.
     * @param {string|Array|Object} args The arguments to process.
     * @param {string} [text] The text to lint (used for TTY).
     * @param {boolean} [allowFlatConfig] Whether or not to allow flat config.
     * @returns {Promise<number>} The exit code for the operation.
     */
    async execute(args: string | any[] | Record<string, any>, text?: string, allowFlatConfig?: boolean): Promise<number> {
        console.log({ args, text, allowFlatConfig });
        if (Array.isArray(args)) {
            debug("CLI args: %o", args.slice(2));
        }

        /*
         * Before doing anything, we need to see if we are using a
         * flat config file. If so, then we need to change the way command
         * line args are parsed. This is temporary, and when we fully
         * switch to flat config we can remove this logic.
         */

        const usingFlatConfig = await shouldUseFlatConfig(allowFlatConfig);

        debug("Using flat config?", usingFlatConfig);

        const CLIOptions = createCLIOptions(usingFlatConfig);

        /** @type {ParsedCLIOptions} */
        let options;

        try {
            // @ts-expect-error
            options = CLIOptions.parse(args);
        } catch (error: any) {
            console.log("357");
            console.log(error);
            debug("Error parsing CLI options:", error.message);
            log.error(error.message);
            return 2;
        }

        const files = options._;
        const useStdin = typeof text === "string";

        if (options.help) {
            // @ts-expect-error
            log.info(CLIOptions.generateHelp());
            return 0;
        }
        if (options.version) {
            log.info(RuntimeInfo.version());
            return 0;
        }
        if (options.envInfo) {
            try {
                log.info(RuntimeInfo.environment());
                return 0;
            } catch (err: any) {
                debug("Error retrieving environment info");
                log.error(err.message);
                return 2;
            }
        }

        if (options.printConfig) {
            if (files.length) {
                log.error("The --print-config option must be used with exactly one file name.");
                return 2;
            }
            if (useStdin) {
                log.error("The --print-config option is not available for piped-in code.");
                return 2;
            }

            const engine = usingFlatConfig
                ? // @ts-expect-error
                  new FlatESLint(await translateOptions(options, "flat"))
                : // @ts-expect-error
                  new ESLint(await translateOptions(options));
            const fileConfig = await engine.calculateConfigForFile(options.printConfig);

            log.info(JSON.stringify(fileConfig, null, "  "));
            return 0;
        }

        debug(`Running on ${useStdin ? "text" : "files"}`);

        if (options.fix && options.fixDryRun) {
            log.error("The --fix option and the --fix-dry-run option cannot be used together.");
            return 2;
        }
        if (useStdin && options.fix) {
            log.error("The --fix option is not available for piped-in code; use --fix-dry-run instead.");
            return 2;
        }
        if (options.fixType && !options.fix && !options.fixDryRun) {
            log.error("The --fix-type option requires either --fix or --fix-dry-run.");
            return 2;
        }
        console.log("424");

        const ActiveESLint = usingFlatConfig ? FlatESLint : ESLint;

        const engine = new ActiveESLint(
            // @ts-expect-error
            await translateOptions(options, usingFlatConfig ? "flat" : "eslintrc")
        );
        let results;

        if (useStdin) {
            results = await engine.lintText(text, {
                filePath: options.stdinFilename,
                warnIgnored: true
            });
        } else {
            results = await engine.lintFiles(files);
        }

        if (options.fix) {
            debug("Fix mode enabled - applying fixes");
            // @ts-expect-error
            await ActiveESLint.outputFixes(results);
        }

        let resultsToPrint = results;

        if (options.quiet) {
            debug("Quiet mode enabled - filtering out warnings");
            // @ts-expect-error
            resultsToPrint = ActiveESLint.getErrorResults(resultsToPrint);
        }

        console.log("456");

        // @ts-expect-error
        const resultCounts = countErrors(results);
        const tooManyWarnings = options.maxWarnings >= 0 && resultCounts.warningCount > options.maxWarnings;
        const resultsMeta = tooManyWarnings
            ? {
                  maxWarningsExceeded: {
                      maxWarnings: options.maxWarnings,
                      foundWarnings: resultCounts.warningCount
                  }
              }
            : {};

        if (
            await printResults(
                // @ts-expect-error
                engine,
                resultsToPrint,
                options.format,
                options.outputFile,
                resultsMeta
            )
        ) {
            // Errors and warnings from the original unfiltered results should determine the exit code
            const shouldExitForFatalErrors = options.exitOnFatalError && resultCounts.fatalErrorCount > 0;

            if (!resultCounts.errorCount && tooManyWarnings) {
                log.error("ESLint found too many warnings (maximum: %s).", options.maxWarnings);
            }

            if (shouldExitForFatalErrors) {
                return 2;
            }

            return resultCounts.errorCount || tooManyWarnings ? 1 : 0;
        }

        return 2;
    }
};

export = cli;
