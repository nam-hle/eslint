/**
 * @fileoverview Compatibility class for flat config.
 * @author Nicholas C. Zakas
 */

// ts-no-check

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import path from 'path';

import createDebug from 'debug';

import environments from '../conf/environments.js';

import { ConfigArrayFactory } from './config-array-factory.js';
import { assert } from './shared/assert.js';
import { Environment, Processor } from './shared/types.js';

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/** @typedef {import("../../shared/types").Environment} Environment */
/** @typedef {import("../../shared/types").Processor} Processor */

const debug = createDebug('eslintrc:flat-compat');
const cafactory = Symbol('cafactory');

/**
 * Translates an ESLintRC-style config object into a flag-config-style config
 * object.
 * @param {Object} eslintrcConfig An ESLintRC-style config object.
 * @param {Object} options Options to help translate the config.
 * @param {string} options.resolveConfigRelativeTo To the directory to resolve
 *      configs from.
 * @param {string} options.resolvePluginsRelativeTo The directory to resolve
 *      plugins from.
 * @param {ReadOnlyMap<string,Environment>} options.pluginEnvironments A map of plugin environment
 *      names to objects.
 * @param {ReadOnlyMap<string,Processor>} options.pluginProcessors A map of plugin processor
 *      names to objects.
 * @returns {Object} A flag-config-style config object.
 */
function translateESLintRC(
    eslintrcConfig: Record<string, any>,
    options: {
        resolveConfigRelativeTo: string;
        resolvePluginsRelativeTo: string;
        pluginEnvironments?: Map<string, Environment>;
        pluginProcessors?: Map<string, Processor>;
    }
): any {
    const { resolveConfigRelativeTo, resolvePluginsRelativeTo, pluginEnvironments, pluginProcessors } = options;
    const flatConfig: Record<string, any> = {};
    const configs = [];
    const languageOptions: Record<string, any> = {};
    const linterOptions: Record<string, any> = {};
    const keysToCopy = ['settings', 'rules', 'processor'];
    const languageOptionsKeysToCopy = ['globals', 'parser', 'parserOptions'];
    const linterOptionsKeysToCopy = ['noInlineConfig', 'reportUnusedDisableDirectives'];

    // check for special settings for eslint:all and eslint:recommended:
    if (eslintrcConfig.settings) {
        if (eslintrcConfig.settings['eslint:all'] === true) {
            return ['eslint:all'];
        }

        if (eslintrcConfig.settings['eslint:recommended'] === true) {
            return ['eslint:recommended'];
        }
    }

    // copy over simple translations
    for (const key of keysToCopy) {
        if (key in eslintrcConfig && typeof eslintrcConfig[key] !== 'undefined') {
            flatConfig[key] = eslintrcConfig[key];
        }
    }

    // copy over languageOptions
    for (const key of languageOptionsKeysToCopy) {
        if (key in eslintrcConfig && typeof eslintrcConfig[key] !== 'undefined') {
            // create the languageOptions key in the flat config
            flatConfig.languageOptions = languageOptions;

            if (key === 'parser') {
                debug(`Resolving parser '${languageOptions[key]}' relative to ${resolveConfigRelativeTo}`);

                if (eslintrcConfig[key].error) {
                    throw eslintrcConfig[key].error;
                }

                languageOptions[key] = eslintrcConfig[key].definition;
                continue;
            }

            // clone any object values that are in the eslintrc config
            if (eslintrcConfig[key] && typeof eslintrcConfig[key] === 'object') {
                languageOptions[key] = {
                    ...eslintrcConfig[key]
                };
            } else {
                languageOptions[key] = eslintrcConfig[key];
            }
        }
    }

    // copy over linterOptions
    for (const key of linterOptionsKeysToCopy) {
        if (key in eslintrcConfig && typeof eslintrcConfig[key] !== 'undefined') {
            flatConfig.linterOptions = linterOptions;
            linterOptions[key] = eslintrcConfig[key];
        }
    }

    // move ecmaVersion a level up
    if (languageOptions.parserOptions) {
        if ('ecmaVersion' in languageOptions.parserOptions) {
            languageOptions.ecmaVersion = languageOptions.parserOptions.ecmaVersion;
            delete languageOptions.parserOptions.ecmaVersion;
        }

        if ('sourceType' in languageOptions.parserOptions) {
            languageOptions.sourceType = languageOptions.parserOptions.sourceType;
            delete languageOptions.parserOptions.sourceType;
        }

        // check to see if we even need parserOptions anymore and remove it if not
        if (Object.keys(languageOptions.parserOptions).length === 0) {
            delete languageOptions.parserOptions;
        }
    }

    // overrides
    if (eslintrcConfig.criteria) {
        flatConfig.files = [(absoluteFilePath: string) => eslintrcConfig.criteria.test(absoluteFilePath)];
    }

    // translate plugins
    if (eslintrcConfig.plugins && typeof eslintrcConfig.plugins === 'object') {
        debug(`Translating plugins: ${eslintrcConfig.plugins}`);

        flatConfig.plugins = {};

        for (const pluginName of Object.keys(eslintrcConfig.plugins)) {
            debug(`Translating plugin: ${pluginName}`);
            debug(`Resolving plugin '${pluginName} relative to ${resolvePluginsRelativeTo}`);

            const { definition: plugin, error } = eslintrcConfig.plugins[pluginName];

            if (error) {
                throw error;
            }

            flatConfig.plugins[pluginName] = plugin;

            // create a config for any processors
            if (plugin.processors) {
                for (const processorName of Object.keys(plugin.processors)) {
                    if (processorName.startsWith('.')) {
                        debug(`Assigning processor: ${pluginName}/${processorName}`);

                        configs.unshift({
                            files: [`**/*${processorName}`],
                            processor: pluginProcessors?.get(`${pluginName}/${processorName}`)
                        });
                    }
                }
            }
        }
    }

    // translate env - must come after plugins
    if (eslintrcConfig.env && typeof eslintrcConfig.env === 'object') {
        for (const envName of Object.keys(eslintrcConfig.env)) {
            // only add environments that are true
            if (eslintrcConfig.env[envName]) {
                debug(`Translating environment: ${envName}`);

                if (environments.has(envName)) {
                    const env = environments.get(envName);
                    assert(env);
                    // built-in environments should be defined first
                    configs.unshift(
                        ...translateESLintRC(env, {
                            resolveConfigRelativeTo,
                            resolvePluginsRelativeTo
                        })
                    );
                } else if (pluginEnvironments?.has(envName)) {
                    const env = pluginEnvironments.get(envName);
                    assert(env);
                    // if the environment comes from a plugin, it should come after the plugin config
                    configs.push(
                        ...translateESLintRC(env, {
                            resolveConfigRelativeTo,
                            resolvePluginsRelativeTo
                        })
                    );
                }
            }
        }
    }

    // only add if there are actually keys in the config
    if (Object.keys(flatConfig).length > 0) {
        configs.push(flatConfig);
    }

    return configs;
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * A compatibility class for working with configs.
 */
class FlatCompat {
    baseDirectory: string;
    resolvePluginsRelativeTo: string;
    [cafactory]: InstanceType<typeof ConfigArrayFactory>;
    constructor(options: { baseDirectory?: string; resolvePluginsRelativeTo?: string } = {}) {
        const { baseDirectory = process.cwd(), resolvePluginsRelativeTo = baseDirectory } = options;
        this.baseDirectory = baseDirectory;
        this.resolvePluginsRelativeTo = resolvePluginsRelativeTo;
        this[cafactory] = new ConfigArrayFactory({
            cwd: baseDirectory,
            resolvePluginsRelativeTo,
            getEslintAllConfig: () => ({ settings: { 'eslint:all': true } }),
            getEslintRecommendedConfig: () => ({ settings: { 'eslint:recommended': true } })
        });
    }

    /**
     * Translates an ESLintRC-style config into a flag-config-style config.
     * @param {Object} eslintrcConfig The ESLintRC-style config object.
     * @returns {Object} A flag-config-style config object.
     */
    config(eslintrcConfig: Record<string, any>) {
        const eslintrcArray = this[cafactory].create(eslintrcConfig, {
            basePath: this.baseDirectory
        });

        const flatArray = [];
        let hasIgnorePatterns = false;

        eslintrcArray.forEach((configData) => {
            if (configData.type === 'config') {
                hasIgnorePatterns ||= !!configData.ignorePattern;
                flatArray.push(
                    ...translateESLintRC(configData, {
                        resolveConfigRelativeTo: path.join(this.baseDirectory, '__placeholder.js'),
                        resolvePluginsRelativeTo: path.join(this.resolvePluginsRelativeTo, '__placeholder.js'),
                        pluginEnvironments: eslintrcArray.pluginEnvironments ?? undefined,
                        pluginProcessors: eslintrcArray.pluginProcessors ?? undefined
                    })
                );
            }
        });

        // combine ignorePatterns to emulate ESLintRC behavior better
        if (hasIgnorePatterns) {
            flatArray.unshift({
                ignores: [
                    (filePath: string) => {
                        // Compute the final config for this file.
                        // This filters config array elements by `files`/`excludedFiles` then merges the elements.
                        const finalConfig = eslintrcArray.extractConfig(filePath);

                        // Test the `ignorePattern` properties of the final config.
                        return Boolean(finalConfig?.ignores) && finalConfig?.ignores?.(filePath);
                    }
                ]
            });
        }

        return flatArray;
    }

    /**
     * Translates the `env` section of an ESLintRC-style config.
     * @param {Object} envConfig The `env` section of an ESLintRC config.
     * @returns {Object[]} An array of flag-config objects representing the environments.
     */
    env(envConfig: Record<string, any>) {
        return this.config({
            env: envConfig
        });
    }

    /**
     * Translates the `extends` section of an ESLintRC-style config.
     * @param {...string} configsToExtend The names of the configs to load.
     * @returns {Object[]} An array of flag-config objects representing the config.
     */
    extends(...configsToExtend: string[]) {
        return this.config({
            extends: configsToExtend
        });
    }

    /**
     * Translates the `plugins` section of an ESLintRC-style config.
     * @param {...string} plugins The names of the plugins to load.
     * @returns {Object[]} An array of flag-config objects representing the plugins.
     */
    plugins(...plugins: string[]) {
        return this.config({
            plugins
        });
    }
}

export { FlatCompat };
