/**
 * @fileoverview Expose out ESLint and CLI to require.
 * @author Ian Christian Myers
 */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import { ESLint } from "./eslint";
import { Linter } from "./linter";
import { RuleTester } from "./rule-tester";
import { SourceCode } from "./source-code";

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

export { Linter, ESLint, RuleTester, SourceCode };
