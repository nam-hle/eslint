/**
 * @fileoverview Define 2 token factories; forward and backward.
 * @author Toru Nagashima
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import { Comment, Token } from "../../shared/types";

import BackwardTokenCommentCursor from "./backward-token-comment-cursor";
import BackwardTokenCursor from "./backward-token-cursor";
import Cursor from "./cursor";
import FilterCursor from "./filter-cursor";
import ForwardTokenCommentCursor from "./forward-token-comment-cursor";
import ForwardTokenCursor from "./forward-token-cursor";
import LimitCursor from "./limit-cursor";
import SkipCursor from "./skip-cursor";
import { FilterPredicate } from "./utils";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * The cursor factory.
 * @private
 */
export class CursorFactory {
    TokenCursor: Cursor;
    TokenCommentCursor: Cursor;
    /**
     * Initializes this cursor.
     * @param {Function} TokenCursor The class of the cursor which iterates tokens only.
     * @param {Function} TokenCommentCursor The class of the cursor which iterates the mix of tokens and comments.
     */
    constructor(TokenCursor: Cursor, TokenCommentCursor: Cursor) {
        this.TokenCursor = TokenCursor;
        this.TokenCommentCursor = TokenCommentCursor;
    }

    /**
     * Creates a base cursor instance that can be decorated by createCursor.
     * @param {Token[]} tokens The array of tokens.
     * @param {Comment[]} comments The array of comments.
     * @param {Object} indexMap The map from locations to indices in `tokens`.
     * @param {number} startLoc The start location of the iteration range.
     * @param {number} endLoc The end location of the iteration range.
     * @param {boolean} includeComments The flag to iterate comments as well.
     * @returns {Cursor} The created base cursor.
     */
    createBaseCursor(tokens: Token[], comments: Comment[], indexMap: any, startLoc: number, endLoc: any, includeComments: boolean): Cursor {
        const Cursor = includeComments ? this.TokenCommentCursor : this.TokenCursor;

        // @ts-expect-error
        return new Cursor(tokens, comments, indexMap, startLoc, endLoc);
    }

    /**
     * Creates a cursor that iterates tokens with normalized options.
     * @param {Token[]} tokens The array of tokens.
     * @param {Comment[]} comments The array of comments.
     * @param {Object} indexMap The map from locations to indices in `tokens`.
     * @param {number} startLoc The start location of the iteration range.
     * @param {number} endLoc The end location of the iteration range.
     * @param {boolean} includeComments The flag to iterate comments as well.
     * @param {Function|null} filter The predicate function to choose tokens.
     * @param {number} skip The count of tokens the cursor skips.
     * @param {number} count The maximum count of tokens the cursor iterates. Zero is no iteration for backward compatibility.
     * @returns {Cursor} The created cursor.
     */
    createCursor(
        tokens: Token[],
        comments: Comment[],
        indexMap: any,
        startLoc: number,
        endLoc: any,
        includeComments: boolean,
        filter: FilterPredicate | null,
        skip: number,
        count: number
    ): Cursor {
        let cursor = this.createBaseCursor(tokens, comments, indexMap, startLoc, endLoc, includeComments);

        if (filter) {
            cursor = new FilterCursor(cursor, filter);
        }
        if (skip >= 1) {
            cursor = new SkipCursor(cursor, skip);
        }
        if (count >= 0) {
            cursor = new LimitCursor(cursor, count);
        }

        return cursor;
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

// @ts-expect-error
export const forward = new CursorFactory(ForwardTokenCursor, ForwardTokenCommentCursor);
// @ts-expect-error
export const backward = new CursorFactory(BackwardTokenCursor, BackwardTokenCommentCursor);
