/**
 * @fileoverview Define the cursor which ignores the first few tokens.
 * @author Toru Nagashima
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import Cursor from "./cursor";
import DecorativeCursor from "./decorative-cursor";

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The decorative cursor which ignores the first few tokens.
 */
export = class SkipCursor extends DecorativeCursor {
    count: number;
    /**
     * Initializes this cursor.
     * @param {Cursor} cursor The cursor to be decorated.
     * @param {number} count The count of tokens this cursor skips.
     */
    constructor(cursor: Cursor, count: number) {
        super(cursor);
        this.count = count;
    }

    /** @inheritdoc */
    moveNext(): boolean {
        while (this.count > 0) {
            this.count -= 1;
            if (!super.moveNext()) {
                return false;
            }
        }
        return super.moveNext();
    }
};
