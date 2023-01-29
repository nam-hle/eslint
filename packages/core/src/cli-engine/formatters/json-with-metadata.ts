/**
 * @fileoverview JSON reporter, including rules metadata
 * @author Chris Meyer
 */
"use strict";

import { FormatterResults } from "@eslint/types";

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export = function (results: FormatterResults, data: any) {
    return JSON.stringify({
        results,
        metadata: data
    });
};
