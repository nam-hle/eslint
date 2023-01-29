/**
 * @fileoverview Default CLIEngineOptions.
 * @author Ian VanSchooten
 */

"use strict";

import { CLIEngineOptions } from "../cli-engine/cli-engine";

const defaultCLIOptions: CLIEngineOptions = {
    configFile: null,
    baseConfig: false,
    rulePaths: [],
    useEslintrc: true,
    envs: [],
    globals: [],
    extensions: null,
    ignore: true,
    ignorePath: undefined,
    cache: false,

    /*
     * in order to honor the cacheFile option if specified
     * this option should not have a default value otherwise
     * it will always be used
     */
    cacheLocation: "",
    cacheFile: ".eslintcache",
    cacheStrategy: "metadata",
    fix: false,
    allowInlineConfig: true,
    reportUnusedDisableDirectives: undefined,
    globInputPaths: true
};

export = defaultCLIOptions;
