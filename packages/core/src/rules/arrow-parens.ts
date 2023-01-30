/**
 * @fileoverview Rule to require parens in arrow function arguments.
 * @author Jxck
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import { Rule, Token, RuleFixer, ESTree } from "@eslint/types";

import astUtils from "./utils/ast-utils";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Determines if the given arrow function has block body.
 * @param {ASTNode} node `ESTree.ArrowFunctionExpression` node.
 * @returns {boolean} `true` if the function has block body.
 */
function hasBlockBody(node: ESTree.ArrowFunctionExpression) {
    return node.body.type === "BlockStatement";
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const rule: Rule = {
    meta: {
        type: "layout",
        docs: {
            description: "Require parentheses around arrow function arguments",
            recommended: false,
            url: "https://eslint.org/docs/rules/arrow-parens"
        },

        fixable: "code",

        schema: [
            {
                enum: ["always", "as-needed"]
            },
            {
                type: "object",
                properties: {
                    requireForBlockBody: {
                        type: "boolean",
                        default: false
                    }
                },
                additionalProperties: false
            }
        ],

        messages: {
            unexpectedParens: "Unexpected parentheses around single function argument.",
            expectedParens: "Expected parentheses around arrow function argument.",

            unexpectedParensInline: "Unexpected parentheses around single function argument having a body with no curly braces.",
            expectedParensBlock: "Expected parentheses around arrow function argument having a body with curly braces."
        }
    },

    create(context) {
        const asNeeded = context.options[0] === "as-needed";
        const requireForBlockBody = asNeeded && context.options[1] && context.options[1].requireForBlockBody === true;

        const sourceCode = context.getSourceCode();

        /**
         * Finds opening paren of parameters for the given arrow function, if it exists.
         * It is assumed that the given arrow function has exactly one parameter.
         * @param {ASTNode} node `ESTree.ArrowFunctionExpression` node.
         * @returns {Token|null} the opening paren, or `null` if the given arrow function doesn't have parens of parameters.
         */
        function findOpeningParenOfParams(node: ESTree.ArrowFunctionExpression): Token | null {
            const tokenBeforeParams = sourceCode.getTokenBefore(node.params[0]);

            if (tokenBeforeParams && astUtils.isOpeningParenToken(tokenBeforeParams) && node.range[0] <= tokenBeforeParams.range[0]) {
                return tokenBeforeParams;
            }

            return null;
        }

        /**
         * Finds closing paren of parameters for the given arrow function.
         * It is assumed that the given arrow function has parens of parameters and that it has exactly one parameter.
         * @param {ASTNode} node `ESTree.ArrowFunctionExpression` node.
         * @returns {Token} the closing paren of parameters.
         */
        function getClosingParenOfParams(node: ESTree.ArrowFunctionExpression) {
            return sourceCode.getTokenAfter(node.params[0], astUtils.isClosingParenToken);
        }

        /**
         * Determines whether the given arrow function has comments inside parens of parameters.
         * It is assumed that the given arrow function has parens of parameters.
         * @param {ASTNode} node `ESTree.ArrowFunctionExpression` node.
         * @param {Token} openingParen Opening paren of parameters.
         * @returns {boolean} `true` if the function has at least one comment inside of parens of parameters.
         */
        function hasCommentsInParensOfParams(node: ESTree.ArrowFunctionExpression, openingParen: Token) {
            return sourceCode.commentsExistBetween(openingParen, getClosingParenOfParams(node));
        }

        /**
         * Determines whether the given arrow function has unexpected tokens before opening paren of parameters,
         * in which case it will be assumed that the existing parens of parameters are necessary.
         * Only tokens within the range of the arrow function (tokens that are part of the arrow function) are taken into account.
         * Example: <T>(a) => b
         * @param {ASTNode} node `ESTree.ArrowFunctionExpression` node.
         * @param {Token} openingParen Opening paren of parameters.
         * @returns {boolean} `true` if the function has at least one unexpected token.
         */
        function hasUnexpectedTokensBeforeOpeningParen(node: ESTree.ArrowFunctionExpression, openingParen: Token) {
            const expectedCount = node.async ? 1 : 0;

            return sourceCode.getFirstToken(node, { skip: expectedCount }) !== openingParen;
        }

        return {
            "ESTree.ArrowFunctionExpression[params.length=1]"(node: ESTree.ArrowFunctionExpression) {
                const shouldHaveParens = !asNeeded || (requireForBlockBody && hasBlockBody(node));
                const openingParen = findOpeningParenOfParams(node);
                const hasParens = openingParen !== null;
                const [param] = node.params;

                if (shouldHaveParens && !hasParens) {
                    context.report({
                        node,
                        messageId: requireForBlockBody ? "expectedParensBlock" : "expectedParens",
                        loc: param.loc,
                        *fix(fixer: RuleFixer) {
                            yield fixer.insertTextBefore(param, "(");
                            yield fixer.insertTextAfter(param, ")");
                        }
                    });
                }

                if (
                    !shouldHaveParens &&
                    hasParens &&
                    param.type === "Identifier" &&
                    // @ts-expect-error
                    !param.typeAnnotation &&
                    // @ts-expect-error
                    !node.returnType &&
                    !hasCommentsInParensOfParams(node, openingParen) &&
                    !hasUnexpectedTokensBeforeOpeningParen(node, openingParen)
                ) {
                    context.report({
                        node,
                        messageId: requireForBlockBody ? "unexpectedParensInline" : "unexpectedParens",
                        loc: param.loc,
                        *fix(fixer: RuleFixer) {
                            const tokenBeforeOpeningParen = sourceCode.getTokenBefore(openingParen);
                            const closingParen = getClosingParenOfParams(node);

                            if (
                                tokenBeforeOpeningParen &&
                                tokenBeforeOpeningParen.range[1] === openingParen.range[0] &&
                                !astUtils.canTokensBeAdjacent(tokenBeforeOpeningParen, sourceCode.getFirstToken(param))
                            ) {
                                yield fixer.insertTextBefore(openingParen, " ");
                            }

                            // remove parens, whitespace inside parens, and possible trailing comma
                            yield fixer.removeRange([openingParen.range[0], param.range[0]]);
                            yield fixer.removeRange([param.range[1], closingParen.range[1]]);
                        }
                    });
                }
            }
        };
    }
};

export = rule;
