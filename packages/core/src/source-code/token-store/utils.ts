/**
 * @fileoverview Define utility functions for token store.
 * @author Toru Nagashima
 */
"use strict";

import { Comment, Token } from "@eslint/types";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Gets `token.range[0]` from the given token.
 * @param {Node|Token|Comment} token The token to get.
 * @returns {number} The start location.
 * @private
 */
function getStartLocation(token: any) {
    return token.range[0];
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * Finds the index of the first token which is after the given location.
 * If it was not found, this returns `tokens.length`.
 * @param {(Token|Comment)[]} tokens It searches the token in this list.
 * @param {number} location The location to search.
 * @returns {number} The found index or `tokens.length`.
 */
export function search(tokens: any, location: number) {
    const index = tokens.findIndex((el: any) => location <= getStartLocation(el));

    return index === -1 ? tokens.length : index;
}

/**
 * Gets the index of the `startLoc` in `tokens`.
 * `startLoc` can be the value of `node.range[1]`, so this checks about `startLoc - 1` as well.
 * @param {(Token|Comment)[]} tokens The tokens to find an index.
 * @param {Object} indexMap The map from locations to indices.
 * @param {number} startLoc The location to get an index.
 * @returns {number} The index.
 */
export function getFirstIndex(tokens: any[], indexMap: any, startLoc: any) {
    if (startLoc in indexMap) {
        return indexMap[startLoc];
    }
    if (startLoc - 1 in indexMap) {
        const index = indexMap[startLoc - 1];
        const token = index >= 0 && index < tokens.length ? tokens[index] : null;

        /*
         * For the map of "comment's location -> token's index", it points the next token of a comment.
         * In that case, +1 is unnecessary.
         */
        if (token && token.range[0] >= startLoc) {
            return index;
        }
        return index + 1;
    }
    return 0;
}

/**
 * Gets the index of the `endLoc` in `tokens`.
 * The information of end locations are recorded at `endLoc - 1` in `indexMap`, so this checks about `endLoc - 1` as well.
 * @param {(Token|Comment)[]} tokens The tokens to find an index.
 * @param {Object} indexMap The map from locations to indices.
 * @param {number} endLoc The location to get an index.
 * @returns {number} The index.
 */
export function getLastIndex(tokens: any[], indexMap: any, endLoc: number) {
    if (endLoc in indexMap) {
        return indexMap[endLoc] - 1;
    }
    if (endLoc - 1 in indexMap) {
        const index = indexMap[endLoc - 1];
        const token = index >= 0 && index < tokens.length ? tokens[index] : null;

        /*
         * For the map of "comment's location -> token's index", it points the next token of a comment.
         * In that case, -1 is necessary.
         */
        if (token && token.range[1] > endLoc) {
            return index - 1;
        }
        return index;
    }
    return tokens.length - 1;
}

export interface FilterPredicate {
    (c: Token | Comment | null): boolean;
}
