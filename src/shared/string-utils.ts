/**
 * @fileoverview Utilities to operate on strings.
 * @author Stephen Wade
 */

/**
 * Converts the first letter of a string to uppercase.
 * @param {string} string The string to operate on
 * @returns {string} The converted string
 */
function upperCaseFirst(string: string) {
    if (string.length <= 1) {
        return string.toUpperCase();
    }
    return string[0].toUpperCase() + string.slice(1);
}

export { upperCaseFirst };
