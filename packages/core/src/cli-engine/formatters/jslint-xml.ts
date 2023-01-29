/**
 * @fileoverview JSLint XML reporter
 * @author Ian Christian Myers
 */
"use strict";

import { FormatterResults } from "@eslint/types";

const xmlEscape = require("../xml-escape");

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export = function (results: FormatterResults) {
    let output = "";

    output += '<?xml version="1.0" encoding="utf-8"?>';
    output += "<jslint>";

    results.forEach(result => {
        const messages = result.messages;

        output += `<file name="${result.filePath}">`;

        messages.forEach(message => {
            output += [
                `<issue line="${message.line}"`,
                `char="${message.column}"`,
                `evidence="${xmlEscape(message.source || "")}"`,
                `reason="${xmlEscape(message.message || "")}${message.ruleId ? ` (${message.ruleId})` : ""}" />`
            ].join(" ");
        });

        output += "</file>";
    });

    output += "</jslint>";

    return output;
};
