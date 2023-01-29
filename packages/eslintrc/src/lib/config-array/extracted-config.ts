/**
 * @fileoverview `ExtractedConfig` class.
 *
 * `ExtractedConfig` class expresses a final configuration for a specific file.
 *
 * It provides one method.
 *
 * - `toCompatibleObjectAsConfigFileContent()`
 *      Convert this configuration to the compatible object as the content of
 *      config files. It converts the loaded parser and plugins to strings.
 *      `CLIEngine#getConfigForFile(filePath)` method uses this method.
 *
 * `ConfigArray#extractConfig(filePath)` creates a `ExtractedConfig` instance.
 *
 * @author Toru Nagashima <https://github.com/mysticatea>
 */

import {
    EnvsMap,
    GlobalsMap,
    ParserOptions,
    ResolvedParser,
    ResolvedPluginsMap,
    Settings,
    SeverityConf
} from '../shared/types.js';

import { IgnorePattern, IgnorePredicate } from './ignore-pattern.js';

// For VSCode intellisense
/** @typedef {import("../../shared/types").ConfigData} ConfigData */
/** @typedef {import("../../shared/types").GlobalConf} GlobalConf */
/** @typedef {import("../../shared/types").SeverityConf} SeverityConf */
/** @typedef {import("./config-dependency").DependentParser} DependentParser */
/** @typedef {import("./config-dependency").DependentPlugin} DependentPlugin */

/**
 * Check if `xs` starts with `ys`.
 * @template T
 * @param {T[]} xs The array to check.
 * @param {T[]} ys The array that may be the first part of `xs`.
 * @returns {boolean} `true` if `xs` starts with `ys`.
 */
function startsWith<T>(xs: readonly T[], ys: readonly T[]) {
    return xs.length >= ys.length && ys.every((y, i) => y === xs[i]);
}

/**
 * The class for extracted config data.
 */
class ExtractedConfig {
    env: EnvsMap;
    configNameOfNoInlineConfig: string;
    globals: GlobalsMap;
    ignores: IgnorePredicate | undefined;
    noInlineConfig: boolean | undefined;
    parser: ResolvedParser | null;
    parserOptions: ParserOptions;
    plugins: ResolvedPluginsMap;
    processor: string | null;
    reportUnusedDisableDirectives: boolean | undefined;
    rules: Record<string, [SeverityConf, ...unknown[]]>;
    settings: Settings;
    constructor() {
        /**
         * The config name what `noInlineConfig` setting came from.
         * @type {string}
         */
        this.configNameOfNoInlineConfig = '';

        /**
         * Environments.
         * @type {Record<string, boolean>}
         */
        this.env = {};

        /**
         * Global variables.
         * @type {Record<string, GlobalConf>}
         */
        this.globals = {};

        /**
         * The glob patterns that ignore to lint.
         * @type {IgnorePredicate | undefined}
         */
        this.ignores = undefined;

        /**
         * The flag that disables directive comments.
         * @type {boolean|undefined}
         */
        this.noInlineConfig = undefined;

        /**
         * Parser definition.
         * @type {Parser|null}
         */
        this.parser = null;

        /**
         * Options for the parser.
         * @type {Object}
         */
        this.parserOptions = {};

        /**
         * Plugin definitions.
         * @type {Record<string, Plugin>}
         */
        this.plugins = {};

        /**
         * Processor ID.
         * @type {string|null}
         */
        this.processor = null;

        /**
         * The flag that reports unused `eslint-disable` directive comments.
         * @type {boolean|undefined}
         */
        this.reportUnusedDisableDirectives = void 0;

        /**
         * Rule settings.
         * @type {Record<string, [SeverityConf, ...any[]]>}
         */
        this.rules = {};

        /**
         * Shared settings.
         * @type {Object}
         */
        this.settings = {};
    }

    /**
     * Convert this config to the compatible object as a config file content.
     * @returns {ConfigData} The converted object.
     */
    toCompatibleObjectAsConfigFileContent() {
        const { configNameOfNoInlineConfig, processor, ignores, ...config } = this;

        const parser = config.parser?.filePath ?? null;
        const plugins = Object.keys(config.plugins).filter(Boolean).reverse();
        let ignorePatterns = ignores?.patterns ?? [];

        // Strip the default patterns from `ignorePatterns`.
        if (startsWith(ignorePatterns, IgnorePattern.DefaultPatterns)) {
            ignorePatterns = ignorePatterns.slice(IgnorePattern.DefaultPatterns.length);
        }

        return { ...config, parser, plugins, ignorePatterns };
    }
}

export { ExtractedConfig };
