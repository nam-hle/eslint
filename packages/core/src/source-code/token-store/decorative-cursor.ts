/**
 * @fileoverview Define the abstract class about cursors which manipulate another cursor.
 * @author Toru Nagashima
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import Cursor from "./cursor";

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The abstract class about cursors which manipulate another cursor.
 */
export = class DecorativeCursor extends Cursor {
    cursor: Cursor;
    /**
     * Initializes this cursor.
     * @param {Cursor} cursor The cursor to be decorated.
     */
    constructor(cursor: Cursor) {
        super();
        this.cursor = cursor;
    }

    /** @inheritdoc */
    moveNext() {
        const retv = this.cursor.moveNext();

        this.current = this.cursor.current;

        return retv;
    }
};
