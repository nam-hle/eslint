/**
 * @fileoverview An object that creates fix commands for rules.
 * @author Nicholas C. Zakas
 */
"use strict";

import { Fix, Token, RuleFixer } from "@eslint/types";

import { ASTNode } from "../estree";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// none!

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Creates a fix command that inserts text at the specified index in the source text.
 * @param {int} index The 0-based index at which to insert the new text.
 * @param {string} text The text to insert.
 * @returns {Object} The fix command.
 * @private
 */
function insertTextAt(index: number, text: string): Fix {
    return { range: [index, index], text };
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * Creates code fixing commands for rules.
 */

const ruleFixer: RuleFixer = Object.freeze({
    /**
     * Creates a fix command that inserts text after the given node or token.
     * The fix is not applied until applyFixes() is called.
     * @param {ASTNode|Token} nodeOrToken The node or token to insert after.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    insertTextAfter(nodeOrToken: ASTNode | Token, text: string) {
        return this.insertTextAfterRange(nodeOrToken.range, text);
    },

    /**
     * Creates a fix command that inserts text after the specified range in the source text.
     * The fix is not applied until applyFixes() is called.
     * @param {int[]} range The range to replace, first item is start of range, second
     *      is end of range.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    insertTextAfterRange(range: number[], text: string) {
        return insertTextAt(range[1], text);
    },

    /**
     * Creates a fix command that inserts text before the given node or token.
     * The fix is not applied until applyFixes() is called.
     * @param {ASTNode|Token} nodeOrToken The node or token to insert before.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    insertTextBefore(nodeOrToken: ASTNode | Token, text: string) {
        return this.insertTextBeforeRange(nodeOrToken.range, text);
    },

    /**
     * Creates a fix command that inserts text before the specified range in the source text.
     * The fix is not applied until applyFixes() is called.
     * @param {int[]} range The range to replace, first item is start of range, second
     *      is end of range.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    insertTextBeforeRange(range: number[], text: string) {
        return insertTextAt(range[0], text);
    },

    /**
     * Creates a fix command that replaces text at the node or token.
     * The fix is not applied until applyFixes() is called.
     * @param {ASTNode|Token} nodeOrToken The node or token to remove.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    replaceText(nodeOrToken: ASTNode | Token, text: string) {
        return this.replaceTextRange(nodeOrToken.range, text);
    },

    /**
     * Creates a fix command that replaces text at the specified range in the source text.
     * The fix is not applied until applyFixes() is called.
     * @param {int[]} range The range to replace, first item is start of range, second
     *      is end of range.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    replaceTextRange(range: [number, number], text: string) {
        return {
            range,
            text
        };
    },

    /**
     * Creates a fix command that removes the node or token from the source.
     * The fix is not applied until applyFixes() is called.
     * @param {ASTNode|Token} nodeOrToken The node or token to remove.
     * @returns {Object} The fix command.
     */
    remove(nodeOrToken: ASTNode | Token) {
        return this.removeRange(nodeOrToken.range);
    },

    /**
     * Creates a fix command that removes the specified range of text from the source.
     * The fix is not applied until applyFixes() is called.
     * @param {int[]} range The range to remove, first item is start of range, second
     *      is end of range.
     * @returns {Object} The fix command.
     */
    removeRange(range: [number, number]) {
        return {
            range,
            text: ""
        };
    }
});

export = ruleFixer;
