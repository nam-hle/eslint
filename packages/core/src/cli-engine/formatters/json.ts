/**
 * @fileoverview JSON reporter
 * @author Burak Yigit Kaya aka BYK
 */
"use strict";

import { FormatterResults } from "@eslint/types";

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export = function (results: FormatterResults) {
    return JSON.stringify(results);
};
