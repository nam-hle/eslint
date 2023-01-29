/**
 * @fileoverview Define the cursor which ignores specified tokens.
 * @author Toru Nagashima
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------
import { Comment, Token } from "../../shared/types";

import Cursor from "./cursor";
import DecorativeCursor from "./decorative-cursor";
import { FilterPredicate } from "./utils";

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The decorative cursor which ignores specified tokens.
 */
export = class FilterCursor extends DecorativeCursor {
    predicate: (c: Token | Comment | null) => boolean;
    /**
     * Initializes this cursor.
     * @param {Cursor} cursor The cursor to be decorated.
     * @param {Function} predicate The predicate function to decide tokens this cursor iterates.
     */
    constructor(cursor: Cursor, predicate: FilterPredicate) {
        super(cursor);
        this.predicate = predicate;
    }

    /** @inheritdoc */
    moveNext() {
        const predicate = this.predicate;

        while (super.moveNext()) {
            if (predicate(this.current)) {
                return true;
            }
        }
        return false;
    }
};
