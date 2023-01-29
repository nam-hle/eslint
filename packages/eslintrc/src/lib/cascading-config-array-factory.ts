/**
 * @fileoverview `CascadingConfigArrayFactory` class.
 *
 * `CascadingConfigArrayFactory` class has a responsibility:
 *
 * 1. Handles cascading of config files.
 *
 * It provides two methods:
 *
 * - `getConfigArrayForFile(filePath)`
 *     Get the corresponded configuration of a given file. This method doesn't
 *     throw even if the given file didn't exist.
 * - `clearCache()`
 *     Clear the internal cache. You have to call this method when
 *     `additionalPluginPool` was updated if `baseConfig` or `cliConfig` depends
 *     on the additional plugins. (`CLIEngine#addPlugin()` method calls this.)
 *
 * @author Toru Nagashima <https://github.com/mysticatea>
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import os from 'os';
import path from 'path';

import debugOrig from 'debug';

import { ConfigArray, ConfigDependency, IgnorePattern } from './config-array/index.js';
import { ConfigArrayFactory } from './config-array-factory.js';
import { assert } from './shared/assert.js';
import ConfigValidator from './shared/config-validator.js';
import { emitDeprecationWarning } from './shared/deprecation-warnings.js';
import { ModuleResolver } from './shared/relative-module-resolver.js';
import { ConfigData, Plugin, Rule } from './shared/types.js';

const debug = debugOrig('eslintrc:cascading-config-array-factory');

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

// Define types for VSCode IntelliSense.
/** @typedef {import("./shared/types").ConfigData} ConfigData */
/** @typedef {import("./shared/types").Parser} Parser */
/** @typedef {import("./shared/types").Plugin} Plugin */
/** @typedef {import("./shared/types").Rule} Rule */
/** @typedef {ReturnType<ConfigArrayFactory["create"]>} ConfigArray */

/**
 * @typedef {Object} CascadingConfigArrayFactoryOptions
 * @property {Map<string,Plugin>} [additionalPluginPool] The map for additional plugins.
 * @property {ConfigData} [baseConfig] The config by `baseConfig` option.
 * @property {ConfigData} [cliConfig] The config by CLI options (`--env`, `--global`, `--ignore-pattern`, `--parser`, `--parser-options`, `--plugin`, and `--rule`). CLI options overwrite the setting in config files.
 * @property {string} [cwd] The base directory to start lookup.
 * @property {string} [ignorePath] The path to the alternative file of `.eslintignore`.
 * @property {string[]} [rulePaths] The value of `--rulesdir` option.
 * @property {string} [specificConfigPath] The value of `--config` option.
 * @property {boolean} [useEslintrc] if `false` then it doesn't load config files.
 * @property {Function} loadRules The function to use to load rules.
 * @property {Map<string,Rule>} builtInRules The rules that are built in to ESLint.
 * @property {Object} [resolver=ModuleResolver] The module resolver object.
 * @property {string} eslintAllPath The path to the definitions for eslint:all.
 * @property {Function} getEslintAllConfig Returns the config data for eslint:all.
 * @property {string} eslintRecommendedPath The path to the definitions for eslint:recommended.
 * @property {Function} getEslintRecommendedConfig Returns the config data for eslint:recommended.
 */

interface CascadingConfigArrayFactoryOptions {
    additionalPluginPool?: Map<string, Plugin>;
    baseConfig?: ConfigData | null;
    cliConfig?: ConfigData | null;
    cwd?: string;
    ignorePath?: string | null;
    rulePaths?: string[];
    builtInRules?: Map<string, Rule>;
    specificConfigPath?: string | null;
    useEslintrc?: boolean;
    loadRules?: (rulesPath: string, cwd: string) => Rule;
    resolver?: ModuleResolver;
    eslintAllPath?: string;
    eslintRecommendedPath?: string;
    getEslintAllConfig?: () => ConfigData;
    getEslintRecommendedConfig?: () => ConfigData;
    resolvePluginsRelativeTo?: string | null;
}

/**
 * @typedef {Object} CascadingConfigArrayFactoryInternalSlots
 * @property {ConfigArray} baseConfigArray The config array of `baseConfig` option.
 * @property {ConfigData} baseConfigData The config data of `baseConfig` option. This is used to reset `baseConfigArray`.
 * @property {ConfigArray} cliConfigArray The config array of CLI options.
 * @property {ConfigData} cliConfigData The config data of CLI options. This is used to reset `cliConfigArray`.
 * @property {ConfigArrayFactory} configArrayFactory The factory for config arrays.
 * @property {Map<string, ConfigArray>} configCache The cache from directory paths to config arrays.
 * @property {string} cwd The base directory to start lookup.
 * @property {WeakMap<ConfigArray, ConfigArray>} finalizeCache The cache from config arrays to finalized config arrays.
 * @property {string} [ignorePath] The path to the alternative file of `.eslintignore`.
 * @property {string[]|null} rulePaths The value of `--rulesdir` option. This is used to reset `baseConfigArray`.
 * @property {string|null} specificConfigPath The value of `--config` option. This is used to reset `cliConfigArray`.
 * @property {boolean} useEslintrc if `false` then it doesn't load config files.
 * @property {Function} loadRules The function to use to load rules.
 * @property {Map<string,Rule>} builtInRules The rules that are built in to ESLint.
 * @property {Object} [resolver=ModuleResolver] The module resolver object.
 * @property {string} eslintAllPath The path to the definitions for eslint:all.
 * @property {Function} getEslintAllConfig Returns the config data for eslint:all.
 * @property {string} eslintRecommendedPath The path to the definitions for eslint:recommended.
 * @property {Function} getEslintRecommendedConfig Returns the config data for eslint:recommended.
 */

interface CascadingConfigArrayFactoryInternalSlots {
    baseConfigArray: ConfigArray;
    baseConfigData?: ConfigData;
    cliConfigArray?: ConfigArray;
    cliConfigData?: ConfigData;
    configArrayFactory: ConfigArrayFactory;
    configCache?: Map<string, ConfigArray>;
    cwd: string;
    finalizeCache: WeakMap<ConfigArray, ConfigArray>;
    ignorePath?: string;
    rulePaths?: string[] | null;
    specificConfigPath?: string | null;
    useEslintrc?: boolean;
    loadRules?: (rulesPath: string, cwd: string) => Rule;
    builtInRules?: Map<string, Rule>;
    resolver?: ModuleResolver;
    eslintAllPath?: string;
    getEslintAllConfig?: () => ConfigData;
    eslintRecommendedPath?: string;
    getEslintRecommendedConfig?: () => ConfigData;
}

/** @type {WeakMap<CascadingConfigArrayFactory, CascadingConfigArrayFactoryInternalSlots>} */
const internalSlotsMap = new WeakMap<CascadingConfigArrayFactory, CascadingConfigArrayFactoryInternalSlots>();

/**
 * Create the config array from `baseConfig` and `rulePaths`.
 * @param {CascadingConfigArrayFactoryInternalSlots} slots The slots.
 * @returns {ConfigArray} The config array of the base configs.
 */
function createBaseConfigArray(
    slots: Pick<
        CascadingConfigArrayFactoryInternalSlots,
        'configArrayFactory' | 'baseConfigData' | 'rulePaths' | 'cwd' | 'loadRules'
    >
) {
    const { configArrayFactory, baseConfigData, rulePaths, cwd, loadRules } = slots;
    const baseConfigArray = configArrayFactory.create(baseConfigData ?? null, {
        name: 'BaseConfig'
    });

    /*
     * Create the config array element for the default ignore patterns.
     * This element has `ignorePattern` property that ignores the default
     * patterns in the current working directory.
     */
    baseConfigArray.unshift(
        configArrayFactory.create(
            { ignorePatterns: IgnorePattern.DefaultPatterns },
            { name: 'DefaultIgnorePattern' }
        )[0]
    );

    /*
     * Load rules `--rulesdir` option as a pseudo plugin.
     * Use a pseudo plugin to define rules of `--rulesdir`, so we can validate
     * the rule's options with only information in the config array.
     */
    if (loadRules && rulePaths && rulePaths.length > 0) {
        baseConfigArray.push({
            type: 'config',
            name: '--rulesdir',
            filePath: '',
            plugins: {
                // @ts-ignore
                '': new ConfigDependency({
                    definition: {
                        rules: rulePaths.reduce((map, rulePath) => Object.assign(map, loadRules(rulePath, cwd)), {})
                    },
                    filePath: '',
                    id: '',
                    importerName: '--rulesdir',
                    importerPath: ''
                })
            }
        });
    }

    return baseConfigArray;
}

/**
 * Create the config array from CLI options.
 * @param {CascadingConfigArrayFactoryInternalSlots} slots The slots.
 * @returns {ConfigArray} The config array of the base configs.
 */
function createCLIConfigArray(
    slots: Pick<
        CascadingConfigArrayFactoryInternalSlots,
        'cliConfigData' | 'configArrayFactory' | 'cwd' | 'ignorePath' | 'specificConfigPath'
    >
) {
    const { cliConfigData, configArrayFactory, cwd, ignorePath, specificConfigPath } = slots;
    const cliConfigArray = configArrayFactory.create(cliConfigData ?? null, { name: 'CLIOptions' });

    cliConfigArray.unshift(
        ...(ignorePath ? configArrayFactory.loadESLintIgnore(ignorePath) : configArrayFactory.loadDefaultESLintIgnore())
    );

    if (specificConfigPath) {
        cliConfigArray.unshift(...configArrayFactory.loadFile(specificConfigPath, { name: '--config', basePath: cwd }));
    }

    return cliConfigArray;
}

/**
 * The error type when there are files matched by a glob, but all of them have been ignored.
 */
class ConfigurationNotFoundError extends Error {
    messageData: { directoryPath: string };
    messageTemplate: string;
    /**
     * @param {string} directoryPath The directory path.
     */
    constructor(directoryPath: string) {
        super(`No ESLint configuration found in ${directoryPath}.`);
        this.messageTemplate = 'no-config-found';
        this.messageData = { directoryPath };
    }
}

/**
 * This class provides the functionality that enumerates every file which is
 * matched by given glob patterns and that configuration.
 */
class CascadingConfigArrayFactory {
    /**
     * Initialize this enumerator.
     * @param {CascadingConfigArrayFactoryOptions} options The options.
     */
    constructor(options: CascadingConfigArrayFactoryOptions = {}) {
        const {
            additionalPluginPool = new Map(),
            baseConfig: baseConfigData = null,
            cliConfig: cliConfigData = null,
            cwd = process.cwd(),
            ignorePath,
            resolvePluginsRelativeTo,
            rulePaths = [],
            specificConfigPath = null,
            useEslintrc = true,
            builtInRules = new Map(),
            loadRules,
            resolver,
            eslintRecommendedPath,
            getEslintRecommendedConfig,
            eslintAllPath,
            getEslintAllConfig
        } = options;
        const configArrayFactory = new ConfigArrayFactory({
            additionalPluginPool,
            cwd,
            resolvePluginsRelativeTo: resolvePluginsRelativeTo ?? undefined,
            builtInRules,
            resolver,
            eslintRecommendedPath,
            getEslintRecommendedConfig,
            eslintAllPath,
            getEslintAllConfig
        });

        internalSlotsMap.set(this, {
            baseConfigArray: createBaseConfigArray({
                baseConfigData: baseConfigData ?? undefined,
                configArrayFactory,
                cwd,
                rulePaths,
                loadRules
            }),
            baseConfigData: baseConfigData ?? undefined,
            cliConfigArray: createCLIConfigArray({
                cliConfigData: cliConfigData ?? undefined,
                configArrayFactory,
                cwd,
                ignorePath: ignorePath ?? undefined,
                specificConfigPath
            }),
            cliConfigData: cliConfigData ?? undefined,
            configArrayFactory,
            configCache: new Map(),
            cwd,
            finalizeCache: new WeakMap(),
            ignorePath: ignorePath ?? undefined,
            rulePaths,
            specificConfigPath,
            useEslintrc,
            builtInRules,
            loadRules
        });
    }

    /**
     * The path to the current working directory.
     * This is used by tests.
     * @type {string}
     */
    get cwd() {
        const slots = internalSlotsMap.get(this);
        assert(!!slots);

        return slots.cwd;
    }

    /**
     * Get the config array of a given file.
     * If `filePath` was not given, it returns the config which contains only
     * `baseConfigData` and `cliConfigData`.
     * @param {string} [filePath] The file path to a file.
     * @param {Object} [options] The options.
     * @param {boolean} [options.ignoreNotFoundError] If `true` then it doesn't throw `ConfigurationNotFoundError`.
     * @returns {ConfigArray} The config array of the file.
     */
    getConfigArrayForFile(filePath?: string, options?: { ignoreNotFoundError: boolean }) {
        const ignoreNotFoundError = options?.ignoreNotFoundError ?? false;
        const slots = internalSlotsMap.get(this);
        assert(!!slots);

        const { baseConfigArray, cliConfigArray = [], cwd } = slots;

        if (!filePath) {
            return new ConfigArray(...baseConfigArray, ...cliConfigArray);
        }

        const directoryPath = path.dirname(path.resolve(cwd, filePath));

        debug(`Load config files for ${directoryPath}.`);

        return this._finalizeConfigArray(
            this._loadConfigInAncestors(directoryPath),
            directoryPath,
            ignoreNotFoundError
        );
    }

    /**
     * Set the config data to override all configs.
     * Require to call `clearCache()` method after this method is called.
     * @param {ConfigData} configData The config data to override all configs.
     * @returns {void}
     */
    setOverrideConfig(configData: ConfigData) {
        const slots = internalSlotsMap.get(this);
        assert(!!slots);

        slots.cliConfigData = configData;
    }

    /**
     * Clear config cache.
     * @returns {void}
     */
    clearCache() {
        const slots = internalSlotsMap.get(this);
        assert(!!slots);

        slots.baseConfigArray = createBaseConfigArray(slots);
        slots.cliConfigArray = createCLIConfigArray(slots);
        slots.configCache?.clear();
    }

    /**
     * Load and normalize config files from the ancestor directories.
     * @param {string} directoryPath The path to a leaf directory.
     * @param {boolean} configsExistInSubdirs `true` if configurations exist in subdirectories.
     * @returns {ConfigArray} The loaded config.
     * @private
     */
    _loadConfigInAncestors(directoryPath: string, configsExistInSubdirs = false) {
        const slots = internalSlotsMap.get(this);
        assert(!!slots);

        const { baseConfigArray, configArrayFactory, configCache, cwd, useEslintrc } = slots;

        if (!useEslintrc) {
            return baseConfigArray;
        }

        let configArray = configCache?.get(directoryPath);

        // Hit cache.
        if (configArray) {
            debug(`Cache hit: ${directoryPath}.`);
            return configArray;
        }
        debug(`No cache found: ${directoryPath}.`);

        const homePath = os.homedir();

        // Consider this is root.
        if (directoryPath === homePath && cwd !== homePath) {
            debug('Stop traversing because of considered root.');
            if (configsExistInSubdirs) {
                const filePath = ConfigArrayFactory.getPathToConfigFileInDirectory(directoryPath);

                if (filePath) {
                    emitDeprecationWarning(filePath, 'ESLINT_PERSONAL_CONFIG_SUPPRESS');
                }
            }
            return this._cacheConfig(directoryPath, baseConfigArray);
        }

        // Load the config on this directory.
        try {
            configArray = configArrayFactory.loadInDirectory(directoryPath);
        } catch (error: any) {
            /* istanbul ignore next */
            if (error.code === 'EACCES') {
                debug("Stop traversing because of 'EACCES' error.");
                return this._cacheConfig(directoryPath, baseConfigArray);
            }
            throw error;
        }

        if (configArray.length > 0 && configArray.isRoot()) {
            debug("Stop traversing because of 'root:true'.");
            configArray.unshift(...baseConfigArray);
            return this._cacheConfig(directoryPath, configArray);
        }

        // Load from the ancestors and merge it.
        const parentPath = path.dirname(directoryPath);
        const parentConfigArray: ConfigArray =
            parentPath && parentPath !== directoryPath
                ? this._loadConfigInAncestors(parentPath, configsExistInSubdirs || configArray.length > 0)
                : baseConfigArray;

        if (configArray.length > 0) {
            configArray.unshift(...parentConfigArray);
        } else {
            configArray = parentConfigArray;
        }

        // Cache and return.
        return this._cacheConfig(directoryPath, configArray);
    }

    /**
     * Freeze and cache a given config.
     * @param {string} directoryPath The path to a directory as a cache key.
     * @param {ConfigArray} configArray The config array as a cache value.
     * @returns {ConfigArray} The `configArray` (frozen).
     */
    _cacheConfig(directoryPath: string, configArray: ConfigArray) {
        const slots = internalSlotsMap.get(this);
        assert(!!slots);

        const { configCache } = slots;

        Object.freeze(configArray);
        configCache?.set(directoryPath, configArray);

        return configArray;
    }

    /**
     * Finalize a given config array.
     * Concatenate `--config` and other CLI options.
     * @param {ConfigArray} configArray The parent config array.
     * @param {string} directoryPath The path to the leaf directory to find config files.
     * @param {boolean} ignoreNotFoundError If `true` then it doesn't throw `ConfigurationNotFoundError`.
     * @returns {ConfigArray} The loaded config.
     * @private
     */
    _finalizeConfigArray(configArray: ConfigArray, directoryPath: string, ignoreNotFoundError: boolean): ConfigArray {
        const slots = internalSlotsMap.get(this);
        assert(!!slots);
        const { cliConfigArray = [], configArrayFactory, finalizeCache, useEslintrc, builtInRules } = slots;

        let finalConfigArray: any = finalizeCache.get(configArray);

        if (!finalConfigArray) {
            finalConfigArray = configArray;

            // Load the personal config if there are no regular config files.
            if (
                useEslintrc &&
                configArray.every((c) => !c.filePath) &&
                cliConfigArray?.every((c) => !c.filePath) // `--config` option can be a file.
            ) {
                const homePath = os.homedir();

                debug('Loading the config file of the home directory:', homePath);

                const personalConfigArray = configArrayFactory.loadInDirectory(homePath, {
                    name: 'PersonalConfig'
                });

                if (personalConfigArray.length > 0 && !directoryPath.startsWith(homePath)) {
                    const lastElement = personalConfigArray[personalConfigArray.length - 1];

                    emitDeprecationWarning(lastElement.filePath, 'ESLINT_PERSONAL_CONFIG_LOAD');
                }

                finalConfigArray = finalConfigArray.concat(personalConfigArray);
            }

            // Apply CLI options.
            if (cliConfigArray.length > 0) {
                finalConfigArray = finalConfigArray.concat(cliConfigArray);
            }

            // Validate rule settings and environments.
            const validator = new ConfigValidator({
                builtInRules
            });

            validator.validateConfigArray(finalConfigArray);

            // Cache it.
            Object.freeze(finalConfigArray);
            finalizeCache.set(configArray, finalConfigArray);

            debug('Configuration was determined: %o on %s', finalConfigArray, directoryPath);
        }

        // At least one element (the default ignore patterns) exists.
        if (!ignoreNotFoundError && useEslintrc && finalConfigArray.length <= 1) {
            throw new ConfigurationNotFoundError(directoryPath);
        }

        return finalConfigArray;
    }
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export { CascadingConfigArrayFactory };
