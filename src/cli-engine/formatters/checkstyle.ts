/**
 * @fileoverview CheckStyle XML reporter
 * @author Ian Christian Myers
 */
"use strict";

import { FormatterMessage } from "../../shared/types";

import xmlEscape from "../xml-escape";

//------------------------------------------------------------------------------
// Helper Functions
//------------------------------------------------------------------------------

/**
 * Returns the severity of warning or error
 * @param {Object} message message object to examine
 * @returns {string} severity level
 * @private
 */
function getMessageType(message: FormatterMessage) {
    if (message.fatal || message.severity === 2) {
        return "error";
    }
    return "warning";
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export = function (results: { filePath: string; messages: FormatterMessage[] }[]) {
    let output = "";

    output += '<?xml version="1.0" encoding="utf-8"?>';
    output += '<checkstyle version="4.3">';

    results.forEach(result => {
        const messages = result.messages;

        output += `<file name="${xmlEscape(result.filePath)}">`;

        messages.forEach(message => {
            output += [
                `<error line="${xmlEscape(String(message.line || 0))}"`,
                `column="${xmlEscape(String(message.column || 0))}"`,
                `severity="${xmlEscape(getMessageType(message))}"`,
                `message="${xmlEscape(message.message)}${message.ruleId ? ` (${message.ruleId})` : ""}"`,
                `source="${message.ruleId ? xmlEscape(`eslint.rules.${message.ruleId}`) : ""}" />`
            ].join(" ");
        });

        output += "</file>";
    });

    output += "</checkstyle>";

    return output;
};
