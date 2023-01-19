/**
 * @fileoverview Config to enable all rules.
 * @author Robert Fletcher
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import builtInRules from "../rules";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const allRules: Record<string, string> = {};

for (const [ruleId, rule] of builtInRules) {
    if (!rule.meta?.deprecated) {
        allRules[ruleId] = "error";
    }
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/** @type {import("../lib/shared/types").ConfigData} */
export = { rules: allRules };
