/**
 * @fileoverview Default configuration
 * @author Nicholas C. Zakas
 */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import Rules from "../rules";

import { FlatConfig } from "./flat-config-schema";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

export const defaultConfig: FlatConfig[] = [
    {
        plugins: {
            "@": {
                parsers: {
                    espree: require("espree")
                },

                /*
                 * Because we try to delay loading rules until absolutely
                 * necessary, a proxy allows us to hook into the lazy-loading
                 * aspect of the rules map while still keeping all of the
                 * relevant configuration inside of the config array.
                 */
                rules: new Proxy(
                    {},
                    {
                        get(_target, property) {
                            // @ts-expect-error
                            return Rules.get(property);
                        },

                        has(_target, property) {
                            // @ts-expect-error
                            return Rules.has(property);
                        }
                    }
                )
            }
        },
        languageOptions: {
            sourceType: "module",
            ecmaVersion: "latest",
            parser: "@/espree",
            parserOptions: {}
        }
    },

    // default ignores are listed here
    {
        ignores: ["**/node_modules/*", ".git/"]
    },

    // intentionally empty config to ensure these files are globbed by default
    {
        files: ["**/*.js", "**/*.mjs"]
    },
    {
        files: ["**/*.cjs"],
        languageOptions: {
            sourceType: "commonjs",
            ecmaVersion: "latest"
        }
    }
];
