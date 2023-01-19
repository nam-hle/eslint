/**
 * @fileoverview Define the cursor which iterates tokens only.
 * @author Toru Nagashima
 */
"use strict";

import { Comment, Token } from "../../shared/types";
//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import Cursor from "./cursor";
import * as utils from "./utils";

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The cursor which iterates tokens only.
 */
export = class ForwardTokenCursor extends Cursor {
    tokens: Token[];
    index: number;
    indexEnd: number;

    /**
     * Initializes this cursor.
     * @param {Token[]} tokens The array of tokens.
     * @param {Comment[]} comments The array of comments.
     * @param {Object} indexMap The map from locations to indices in `tokens`.
     * @param {number} startLoc The start location of the iteration range.
     * @param {number} endLoc The end location of the iteration range.
     */
    constructor(tokens: Token[], _comments: Comment[], indexMap: any, startLoc: number, endLoc: number) {
        super();
        this.tokens = tokens;
        this.index = utils.getFirstIndex(tokens, indexMap, startLoc);
        this.indexEnd = utils.getLastIndex(tokens, indexMap, endLoc);
    }

    /** @inheritdoc */
    moveNext() {
        if (this.index <= this.indexEnd) {
            this.current = this.tokens[this.index];
            this.index += 1;
            return true;
        }
        return false;
    }

    /*
     *
     * Shorthand for performance.
     *
     */

    /** @inheritdoc */
    getOneToken() {
        return this.index <= this.indexEnd ? this.tokens[this.index] : null;
    }

    /** @inheritdoc */
    getAllTokens() {
        return this.tokens.slice(this.index, this.indexEnd + 1);
    }
};
