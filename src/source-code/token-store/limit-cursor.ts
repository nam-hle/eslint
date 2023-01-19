/**
 * @fileoverview Define the cursor which limits the number of tokens.
 * @author Toru Nagashima
 */
"use strict";

import Cursor from "./cursor";
//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import DecorativeCursor from "./decorative-cursor";

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The decorative cursor which limits the number of tokens.
 */
export = class LimitCursor extends DecorativeCursor {
    count: number;
    /**
     * Initializes this cursor.
     * @param {Cursor} cursor The cursor to be decorated.
     * @param {number} count The count of tokens this cursor iterates.
     */
    constructor(cursor: Cursor, count: number) {
        super(cursor);
        this.count = count;
    }

    /** @inheritdoc */
    moveNext() {
        if (this.count > 0) {
            this.count -= 1;
            return super.moveNext();
        }
        return false;
    }
};
