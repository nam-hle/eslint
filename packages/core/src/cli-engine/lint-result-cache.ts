/**
 * @fileoverview Utility for caching lint results.
 * @author Kevin Partington
 */
"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import assert from "assert";
import fs from "fs";

import { ConfigArray } from "@eslint/eslintrc";
import Debug from "debug";
import fileEntryCache, { FileEntryCache } from "file-entry-cache";
import stringify from "json-stable-stringify-without-jsonify";

import { packageJson } from "../shared/package";

import hash from "./hash";

const debug = Debug("eslint:lint-result-cache");

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const configHashCache = new WeakMap();
const nodeVersion = process && process.version;

const validCacheStrategies = ["metadata", "content"];
const invalidCacheStrategyErrorMessage = `Cache strategy must be one of: ${validCacheStrategies
    .map(strategy => `"${strategy}"`)
    .join(", ")}`;

/**
 * Tests whether a provided cacheStrategy is valid
 * @param {string} cacheStrategy The cache strategy to use
 * @returns {boolean} true if `cacheStrategy` is one of `validCacheStrategies`; false otherwise
 */
function isValidCacheStrategy(cacheStrategy: string) {
    return validCacheStrategies.includes(cacheStrategy);
}

/**
 * Calculates the hash of the config
 * @param {ConfigArray} config The config.
 * @returns {string} The hash of the config
 */
function hashOfConfigFor(config: ConfigArray) {
    if (!configHashCache.has(config)) {
        configHashCache.set(config, hash(`${packageJson.version}_${nodeVersion}_${stringify(config)}`));
    }

    return configHashCache.get(config);
}

//-----------------------------------------------------------------------------
// Public Interface
//-----------------------------------------------------------------------------

/**
 * Lint result cache. This wraps around the file-entry-cache module,
 * transparently removing properties that are difficult or expensive to
 * serialize and adding them back in on retrieval.
 */
class LintResultCache {
    private fileEntryCache: FileEntryCache;
    private cacheFileLocation: string;
    /**
     * Creates a new LintResultCache instance.
     * @param {string} cacheFileLocation The cache file location.
     * @param {"metadata" | "content"} cacheStrategy The cache strategy to use.
     */
    constructor(cacheFileLocation: string, cacheStrategy: "metadata" | "content") {
        assert(cacheFileLocation, "Cache file location is required");
        assert(cacheStrategy, "Cache strategy is required");
        assert(isValidCacheStrategy(cacheStrategy), invalidCacheStrategyErrorMessage);

        debug(`Caching results to ${cacheFileLocation}`);

        const useChecksum = cacheStrategy === "content";

        debug(`Using "${cacheStrategy}" strategy to detect changes`);

        this.fileEntryCache = fileEntryCache.create(cacheFileLocation, void 0, useChecksum);
        this.cacheFileLocation = cacheFileLocation;
    }

    /**
     * Retrieve cached lint results for a given file path, if present in the
     * cache. If the file is present and has not been changed, rebuild any
     * missing result information.
     * @param {string} filePath The file for which to retrieve lint results.
     * @param {ConfigArray} config The config of the file.
     * @returns {Object|null} The rebuilt lint results, or null if the file is
     *   changed or not in the filesystem.
     */
    getCachedLintResults(filePath: string, config: ConfigArray) {
        /*
         * Cached lint results are valid if and only if:
         * 1. The file is present in the filesystem
         * 2. The file has not changed since the time it was previously linted
         * 3. The ESLint configuration has not changed since the time the file
         *    was previously linted
         * If any of these are not true, we will not reuse the lint results.
         */
        const fileDescriptor = this.fileEntryCache.getFileDescriptor(filePath);
        const hashOfConfig = hashOfConfigFor(config);
        const changed =
            // @ts-expect-error
            fileDescriptor.changed || fileDescriptor.meta?.hashOfConfig !== hashOfConfig;

        if (fileDescriptor.notFound) {
            debug(`File not found on the file system: ${filePath}`);
            return null;
        }

        if (changed) {
            debug(`Cache entry not found or no longer valid: ${filePath}`);
            return null;
        }

        // If source is present but null, need to reread the file from the filesystem.
        // @ts-expect-error
        if (fileDescriptor.meta.results && fileDescriptor.meta.results.source === null) {
            debug(`Rereading cached result source from filesystem: ${filePath}`);
            // @ts-expect-error
            fileDescriptor.meta.results.source = fs.readFileSync(filePath, "utf-8");
        }

        // @ts-expect-error
        return fileDescriptor.meta.results;
    }

    /**
     * Set the cached lint results for a given file path, after removing any
     * information that will be both unnecessary and difficult to serialize.
     * Avoids caching results with an "output" property (meaning fixes were
     * applied), to prevent potentially incorrect results if fixes are not
     * written to disk.
     * @param {string} filePath The file for which to set lint results.
     * @param {ConfigArray} config The config of the file.
     * @param {Object} result The lint result to be set for the file.
     * @returns {void}
     */
    setCachedLintResults(filePath: string, config: ConfigArray, result: object) {
        if (result && Object.prototype.hasOwnProperty.call(result, "output")) {
            return;
        }

        const fileDescriptor = this.fileEntryCache.getFileDescriptor(filePath);

        if (fileDescriptor && !fileDescriptor.notFound) {
            debug(`Updating cached result: ${filePath}`);

            // Serialize the result, except that we want to remove the file source if present.
            const resultToSerialize = Object.assign({}, result);

            /*
             * Set result.source to null.
             * In `getCachedLintResults`, if source is explicitly null, we will
             * read the file from the filesystem to set the value again.
             */
            if (Object.prototype.hasOwnProperty.call(resultToSerialize, "source")) {
                // @ts-expect-error
                resultToSerialize.source = null;
            }

            // @ts-expect-error
            fileDescriptor.meta.results = resultToSerialize;
            // @ts-expect-error
            fileDescriptor.meta.hashOfConfig = hashOfConfigFor(config);
        }
    }

    /**
     * Persists the in-memory cache to disk.
     * @returns {void}
     */
    reconcile() {
        debug(`Persisting cached results: ${this.cacheFileLocation}`);
        this.fileEntryCache.reconcile();
    }
}

export = LintResultCache;
