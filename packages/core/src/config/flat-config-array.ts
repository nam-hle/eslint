/**
 * @fileoverview Flat Config Array
 * @author Nicholas C. Zakas
 */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

// @ts-expect-error
import { ConfigArray, ConfigArraySymbol } from "@humanwhocodes/config-array";

import recommendedConfig from "../conf/eslint-recommended";

import { defaultConfig } from "./default-config";
import { flatConfigSchema } from "./flat-config-schema";
import { RuleValidator } from "./rule-validator";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const ruleValidator = new RuleValidator();

/**
 * Splits a plugin identifier in the form a/b/c into two parts: a/b and c.
 * @param {string} identifier The identifier to parse.
 * @returns {{objectName: string, pluginName: string}} The parts of the plugin
 *      name.
 */
function splitPluginIdentifier(identifier: string) {
    const parts = identifier.split("/");

    return {
        objectName: parts.pop(),
        pluginName: parts.join("/")
    };
}

const originalBaseConfig = Symbol("originalBaseConfig");

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Represents an array containing configuration information for ESLint.
 */
class FlatConfigArray extends ConfigArray {
    [originalBaseConfig]: any;
    shouldIgnore: boolean;
    /**
     * Creates a new instance.
     * @param {*[]} configs An array of configuration information.
     * @param {{basePath: string, shouldIgnore: boolean, baseConfig: FlatConfig}} options The options
     *      to use for the config array instance.
     */
    constructor(
        configs: any[],
        {
            basePath,
            shouldIgnore = true,
            baseConfig = defaultConfig
        }: {
            basePath?: string;
            shouldIgnore?: boolean;
            baseConfig?: any;
        } = {}
    ) {
        super(configs, {
            basePath,
            schema: flatConfigSchema
        });

        if (baseConfig[Symbol.iterator]) {
            // @ts-expect-error
            this.unshift(...baseConfig);
        } else {
            // @ts-expect-error
            this.unshift(baseConfig);
        }

        /**
         * The base config used to build the config array.
         * @type {Array<FlatConfig>}
         */
        this[originalBaseConfig] = baseConfig;
        Object.defineProperty(this, originalBaseConfig, { writable: false });

        /**
         * Determines if `ignores` fields should be honored.
         * If true, then all `ignores` fields are honored.
         * if false, then only `ignores` fields in the baseConfig are honored.
         * @type {boolean}
         */
        this.shouldIgnore = shouldIgnore;
        Object.defineProperty(this, "shouldIgnore", { writable: false });
    }

    /* eslint-disable class-methods-use-this -- Desired as instance method */
    /**
     * Replaces a config with another config to allow us to put strings
     * in the config array that will be replaced by objects before
     * normalization.
     * @param {Object} config The config to preprocess.
     * @returns {Object} The preprocessed config.
     */
    [ConfigArraySymbol.preprocessConfig](config: any) {
        if (config === "eslint:recommended") {
            return recommendedConfig;
        }

        if (config === "eslint:all") {
            /*
             * Load `eslint-all.js` here instead of at the top level to avoid loading all rule modules
             * when it isn't necessary. `eslint-all.js` reads `meta` of rule objects to filter out deprecated ones,
             * so requiring `eslint-all.js` module loads all rule modules as a consequence.
             */
            return require("../conf/eslint-all");
        }

        /*
         * If `shouldIgnore` is false, we remove any ignore patterns specified
         * in the config so long as it's not a default config and it doesn't
         * have a `files` entry.
         */
        if (!this.shouldIgnore && !this[originalBaseConfig].includes(config) && config.ignores && !config.files) {
            /* eslint-disable-next-line no-unused-vars -- need to strip off other keys */
            const { ignores, ...otherKeys } = config;

            return otherKeys;
        }

        return config;
    }

    /**
     * Finalizes the config by replacing plugin references with their objects
     * and validating rule option schemas.
     * @param {Object} config The config to finalize.
     * @returns {Object} The finalized config.
     * @throws {TypeError} If the config is invalid.
     */
    [ConfigArraySymbol.finalizeConfig](config: any) {
        const { plugins, languageOptions, processor } = config;
        let parserName: string, processorName: string;
        let invalidParser = false,
            invalidProcessor = false;

        // Check parser value
        if (languageOptions && languageOptions.parser) {
            if (typeof languageOptions.parser === "string") {
                const { pluginName, objectName: localParserName } = splitPluginIdentifier(languageOptions.parser);

                parserName = languageOptions.parser;

                if (
                    !plugins ||
                    !plugins[pluginName] ||
                    !plugins[pluginName].parsers ||
                    // @ts-expect-error
                    !plugins[pluginName].parsers[localParserName]
                ) {
                    throw new TypeError(`Key "parser": Could not find "${localParserName}" in plugin "${pluginName}".`);
                }

                // @ts-expect-error
                languageOptions.parser = plugins[pluginName].parsers[localParserName];
            } else {
                invalidParser = true;
            }
        }

        // Check processor value
        if (processor) {
            if (typeof processor === "string") {
                const { pluginName, objectName: localProcessorName } = splitPluginIdentifier(processor);

                processorName = processor;

                if (
                    !plugins ||
                    !plugins[pluginName] ||
                    !plugins[pluginName].processors ||
                    // @ts-expect-error
                    !plugins[pluginName].processors[localProcessorName]
                ) {
                    throw new TypeError(`Key "processor": Could not find "${localProcessorName}" in plugin "${pluginName}".`);
                }

                // @ts-expect-error
                config.processor = plugins[pluginName].processors[localProcessorName];
            } else {
                invalidProcessor = true;
            }
        }

        ruleValidator.validate(config);

        // apply special logic for serialization into JSON
        /* eslint-disable object-shorthand -- shorthand would change "this" value */
        Object.defineProperty(config, "toJSON", {
            value: function () {
                if (invalidParser) {
                    throw new Error("Caching is not supported when parser is an object.");
                }

                if (invalidProcessor) {
                    throw new Error("Caching is not supported when processor is an object.");
                }

                return {
                    ...this,
                    plugins: Object.keys(plugins),
                    languageOptions: {
                        ...languageOptions,
                        parser: parserName
                    },
                    processor: processorName
                };
            }
        });
        /* eslint-enable object-shorthand -- ok to enable now */

        return config;
    }
    /* eslint-enable class-methods-use-this -- Desired as instance method */
}

export { FlatConfigArray };
