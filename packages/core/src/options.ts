/**
 * @fileoverview Options configuration for optionator.
 * @author George Zahariev
 */

"use strict";

import { ParsedCLIOptions } from "./types";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const optionator = require("optionator");

//------------------------------------------------------------------------------
// Typedefs
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Initialization and Public Interface
//------------------------------------------------------------------------------

// exports "parse(args)", "generateHelp()", and "generateHelpForOption(optionName)"

/**
 * Creates the CLI options for ESLint.
 * @param {boolean} usingFlatConfig Indicates if flat config is being used.
 * @returns {Object} The optionator instance.
 */
export = function (usingFlatConfig: boolean): ParsedCLIOptions {
    let lookupFlag;

    if (usingFlatConfig) {
        lookupFlag = {
            option: "config-lookup",
            type: "Boolean",
            default: "true",
            description: "Disable look up for eslint.config.js"
        };
    } else {
        lookupFlag = {
            option: "eslintrc",
            type: "Boolean",
            default: "true",
            description: "Disable use of configuration from .eslintrc.*"
        };
    }

    console.log({ usingFlatConfig });

    let envFlag;

    if (!usingFlatConfig) {
        envFlag = {
            option: "env",
            type: "[String]",
            description: "Specify environments"
        };
    }

    let extFlag;

    if (!usingFlatConfig) {
        extFlag = {
            option: "ext",
            type: "[String]",
            description: "Specify JavaScript file extensions"
        };
    }

    let resolvePluginsFlag;

    if (!usingFlatConfig) {
        resolvePluginsFlag = {
            option: "resolve-plugins-relative-to",
            type: "path::String",
            description: "A folder where plugins should be resolved from, CWD by default"
        };
    }

    let rulesDirFlag;

    if (!usingFlatConfig) {
        rulesDirFlag = {
            option: "rulesdir",
            type: "[path::String]",
            description: "Load additional rules from this directory. Deprecated: Use rules from plugins"
        };
    }

    let ignorePathFlag;

    if (!usingFlatConfig) {
        ignorePathFlag = {
            option: "ignore-path",
            type: "path::String",
            description: "Specify path of ignore file"
        };
    }

    return optionator({
        prepend: "eslint [options] file.js [file.js] [dir]",
        defaults: {
            concatRepeatedArrays: true,
            mergeRepeatedObjects: true
        },
        options: [
            {
                heading: "Basic configuration"
            },
            lookupFlag,
            {
                option: "config",
                alias: "c",
                type: "path::String",
                description: usingFlatConfig
                    ? "Use this configuration instead of eslint.config.js"
                    : "Use this configuration, overriding .eslintrc.* config options if present"
            },
            envFlag,
            extFlag,
            {
                option: "global",
                type: "[String]",
                description: "Define global variables"
            },
            {
                option: "parser",
                type: "String",
                description: "Specify the parser to be used"
            },
            {
                option: "parser-options",
                type: "Object",
                description: "Specify parser options"
            },
            resolvePluginsFlag,
            {
                heading: "Specify Rules and Plugins"
            },
            {
                option: "plugin",
                type: "[String]",
                description: "Specify plugins"
            },
            {
                option: "rule",
                type: "Object",
                description: "Specify rules"
            },
            rulesDirFlag,
            {
                heading: "Fix Problems"
            },
            {
                option: "fix",
                type: "Boolean",
                default: false,
                description: "Automatically fix problems"
            },
            {
                option: "fix-dry-run",
                type: "Boolean",
                default: false,
                description: "Automatically fix problems without saving the changes to the file system"
            },
            {
                option: "fix-type",
                type: "Array",
                description: "Specify the types of fixes to apply (directive, problem, suggestion, layout)"
            },
            {
                heading: "Ignore Files"
            },
            ignorePathFlag,
            {
                option: "ignore",
                type: "Boolean",
                default: "true",
                description: "Disable use of ignore files and patterns"
            },
            {
                option: "ignore-pattern",
                type: "[String]",
                description: "Pattern of files to ignore (in addition to those in .eslintignore)",
                concatRepeatedArrays: [
                    true,
                    {
                        oneValuePerFlag: true
                    }
                ]
            },
            {
                heading: "Use stdin"
            },
            {
                option: "stdin",
                type: "Boolean",
                default: "false",
                description: "Lint code provided on <STDIN>"
            },
            {
                option: "stdin-filename",
                type: "String",
                description: "Specify filename to process STDIN as"
            },
            {
                heading: "Handle Warnings"
            },
            {
                option: "quiet",
                type: "Boolean",
                default: "false",
                description: "Report errors only"
            },
            {
                option: "max-warnings",
                type: "Int",
                default: "-1",
                description: "Number of warnings to trigger nonzero exit code"
            },
            {
                heading: "Output"
            },
            {
                option: "output-file",
                alias: "o",
                type: "path::String",
                description: "Specify file to write report to"
            },
            {
                option: "format",
                alias: "f",
                type: "String",
                default: "stylish",
                description: "Use a specific output format"
            },
            {
                option: "color",
                type: "Boolean",
                alias: "no-color",
                description: "Force enabling/disabling of color"
            },
            {
                heading: "Inline configuration comments"
            },
            {
                option: "inline-config",
                type: "Boolean",
                default: "true",
                description: "Prevent comments from changing config or rules"
            },
            {
                option: "report-unused-disable-directives",
                type: "Boolean",
                default: void 0,
                description: "Adds reported errors for unused eslint-disable directives"
            },
            {
                heading: "Caching"
            },
            {
                option: "cache",
                type: "Boolean",
                default: "false",
                description: "Only check changed files"
            },
            {
                option: "cache-file",
                type: "path::String",
                default: ".eslintcache",
                description: "Path to the cache file. Deprecated: use --cache-location"
            },
            {
                option: "cache-location",
                type: "path::String",
                description: "Path to the cache file or directory"
            },
            {
                option: "cache-strategy",
                dependsOn: ["cache"],
                type: "String",
                default: "metadata",
                enum: ["metadata", "content"],
                description: "Strategy to use for detecting changed files in the cache"
            },
            {
                heading: "Miscellaneous"
            },
            {
                option: "init",
                type: "Boolean",
                default: "false",
                description: "Run config initialization wizard"
            },
            {
                option: "env-info",
                type: "Boolean",
                default: "false",
                description: "Output execution environment information"
            },
            {
                option: "error-on-unmatched-pattern",
                type: "Boolean",
                default: "true",
                description: "Prevent errors when pattern is unmatched"
            },
            {
                option: "exit-on-fatal-error",
                type: "Boolean",
                default: "false",
                description: "Exit with exit code 2 in case of fatal error"
            },
            {
                option: "debug",
                type: "Boolean",
                default: false,
                description: "Output debugging information"
            },
            {
                option: "help",
                alias: "h",
                type: "Boolean",
                description: "Show help"
            },
            {
                option: "version",
                alias: "v",
                type: "Boolean",
                description: "Output the version number"
            },
            {
                option: "print-config",
                type: "path::String",
                description: "Print the configuration for the given file"
            }
        ].filter(value => !!value)
    });
};
