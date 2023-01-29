/**
 * @fileoverview Define common types for input completion.
 * @author Toru Nagashima <https://github.com/mysticatea>
 */
"use strict";

import { JSONSchema4 } from "json-schema";

import { DeprecatedRuleInfo, Fix, GlobalConf, LintMessage, Parser, ParserOptions, RuleMeta, SeverityNumber } from "./types-eslintrc";
import { ASTNode, Position, SourceLocation } from "./types-estree";

export type IndexMap = Record<number, number>;
export interface Listener {
    (...args: any[]): any;
}

export interface Token {
    type: string;
    range: [number, number];
    value: string;
    loc: SourceLocation;
}
export interface Comment {
    value: string;
    range: number[];
    loc: SourceLocation;
}

export interface RuleFixer {
    insertTextAfter(nodeOrToken: ASTNode | Token, text: string): Fix;
    insertTextAfterRange(range: number[], text: string): Fix;
    insertTextBefore(nodeOrToken: ASTNode | Token, text: string): Fix;
    insertTextBeforeRange(range: number[], text: string): Fix;
    replaceText(nodeOrToken: ASTNode | Token, text: string): Fix;
    replaceTextRange(range: number[], text: string): Fix;
    remove(nodeOrToken: ASTNode | Token): Fix;
    removeRange(range: number[]): Fix;
}

export interface MessageDescriptor {
    node: ASTNode;
    loc?: Position | { start: Position; end: Position | null };
    message: string;
    fix?(fixer: RuleFixer): Fix | Fix[] | IterableIterator<Fix>;
    data?: object;
    suggest: Array<{ desc?: string; messageId?: string; fix: (fixer: RuleFixer) => void }>;
}

export function isPosition(obj: any): obj is Position {
    return typeof obj === "object" && obj !== null && "line" in obj && "column" in obj;
}

/**
 * An error message description
 * @typedef {Object} MessageDescriptor
 * @property {ASTNode} [node] The reported node
 * @property {Location} loc The location of the problem.
 * @property {string} message The problem message.
 * @property {Object} [data] Optional data to use to fill in placeholders in the
 *      message.
 * @property {Function} [fix] The function to call that creates a fix command.
 * @property {Array<{desc?: string, messageId?: string, fix: Function}>} suggest Suggestion descriptions and functions to create a the associated fixes.
 */

/**
 * Information about the report
 * @typedef {Object} ReportInfo
 * @property {string} ruleId The rule ID
 * @property {(0|1|2)} severity Severity of the error
 * @property {(string|undefined)} message The message
 * @property {(string|undefined)} [messageId] The message ID
 * @property {number} line The line number
 * @property {number} column The column number
 * @property {(number|undefined)} [endLine] The ending line number
 * @property {(number|undefined)} [endColumn] The ending column number
 * @property {(string|null)} nodeType Type of node
 * @property {string} source Source text
 * @property {({text: string, range: (number[]|null)}|null)} [fix] The fix object
 * @property {Array<{text: string, range: (number[]|null)}|null>} [suggestions] Suggestion info
 */

export interface ReportInfo {
    ruleId: string;
    severity: 0 | 1 | 2;
    message: string | undefined;
    messageId?: string;
    line: number;
    column: number;
    endLine: number | undefined;
    endColumn: number | undefined;
    nodeType: string | undefined;
    source: string;
    fix?: { text: string; range: number[] | null } | null;
    suggestions?: { text: string; range: number[] | null } | null;
}

export interface FormatterMessage {
    source: string;
    line: number;
    column: number;
    message: string;
    ruleId: string;
    fatal: string;
    severity: number;
}

export type FormatterResults = {
    messages: FormatterMessage[];
    filePath: string;
    errorCount: number;
    warningCount: number;
    fixableErrorCount: number;
    fixableWarningCount: number;
}[];

export interface SafeEmitter {
    on: (eventName: string, listenerFunc: Listener) => void;
    emit: (eventName: string, arg1?: any, arg2?: any, arg3?: any) => void;
    eventNames: () => string[];
}

/**
 * @typedef {Object} EcmaFeatures
 * @property {boolean} [globalReturn] Enabling `return` statements at the top-level.
 * @property {boolean} [jsx] Enabling JSX syntax.
 * @property {boolean} [impliedStrict] Enabling strict mode always.
 */

// export interface EcmaFeatures {
//     globalReturn?: boolean;
//     jsx?: boolean;
//     impliedStrict?: boolean;
// }

/**
 * @typedef {Object} ParserOptions
 * @property {EcmaFeatures} [ecmaFeatures] The optional features.
 * @property {3|5|6|7|8|9|10|11|12|13|14|2015|2016|2017|2018|2019|2020|2021|2022|2023} [ecmaVersion] The ECMAScript version (or revision number).
 * @property {"script"|"module"} [sourceType] The source code type.
 * @property {boolean} [allowReserved] Allowing the use of reserved words as identifiers in ES3.
 */

// export interface ParserOptions {
//     ecmaFeatures?: EcmaFeatures;
//     // prettier-ignore
//     ecmaVersion?: | 3 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023;
//     sourceType?: 'script' | 'module';
//     allowReserved?: boolean;
// }

/**
 * @typedef {Object} LanguageOptions
 * @property {number|"latest"} [ecmaVersion] The ECMAScript version (or revision number).
 * @property {Record<string, GlobalConf>} [globals] The global variable settings.
 * @property {"script"|"module"|"commonjs"} [sourceType] The source code type.
 * @property {string|Object} [parser] The parser to use.
 * @property {Object} [parserOptions] The parser options to use.
 */

export interface LanguageOptions {
    ecmaVersion?: number | "latest";
    globals?: Record<string, GlobalConf>;
    sourceType?: "script" | "module" | "commonjs";
    parser?: string | Parser;
    parserOptions?: ParserOptions;
}

/**
 * @typedef {Object} ConfigData
 * @property {Record<string, boolean>} [env] The environment settings.
 * @property {string | string[]} [extends] The path to other config files or the package name of shareable configs.
 * @property {Record<string, GlobalConf>} [globals] The global variable settings.
 * @property {string | string[]} [ignorePatterns] The glob patterns that ignore to lint.
 * @property {boolean} [noInlineConfig] The flag that disables directive comments.
 * @property {OverrideConfigData[]} [overrides] The override settings per kind of files.
 * @property {string} [parser] The path to a parser or the package name of a parser.
 * @property {ParserOptions} [parserOptions] The parser options.
 * @property {string[]} [plugins] The plugin specifiers.
 * @property {string} [processor] The processor specifier.
 * @property {boolean} [reportUnusedDisableDirectives] The flag to report unused `eslint-disable` comments.
 * @property {boolean} [root] The root flag.
 * @property {Record<string, RuleConf>} [rules] The rule settings.
 * @property {Object} [settings] The shared settings.
 */

// export interface ConfigData {
//     env?: Record<string, boolean>;
//     extends?: string | string[];
//     globals?: Record<string, GlobalConf>;
//     ignorePatterns?: string | string[];
//     noInlineConfig?: boolean;
//     overrides?: OverrideConfigData[];
//     parser?: string | object;
//     parserOptions?: ParserOptions;
//     plugins?: string[];
//     processor?: string;
//     reportUnusedDisableDirectives?: boolean;
//     root?: boolean;
//     rules?: Record<string, RuleConf>;
//     settings?: object;
// }

/**
 * @typedef {Object} OverrideConfigData
 * @property {Record<string, boolean>} [env] The environment settings.
 * @property {string | string[]} [excludedFiles] The glob patterns for excluded files.
 * @property {string | string[]} [extends] The path to other config files or the package name of shareable configs.
 * @property {string | string[]} files The glob patterns for target files.
 * @property {Record<string, GlobalConf>} [globals] The global variable settings.
 * @property {boolean} [noInlineConfig] The flag that disables directive comments.
 * @property {OverrideConfigData[]} [overrides] The override settings per kind of files.
 * @property {string} [parser] The path to a parser or the package name of a parser.
 * @property {ParserOptions} [parserOptions] The parser options.
 * @property {string[]} [plugins] The plugin specifiers.
 * @property {string} [processor] The processor specifier.
 * @property {boolean} [reportUnusedDisableDirectives] The flag to report unused `eslint-disable` comments.
 * @property {Record<string, RuleConf>} [rules] The rule settings.
 * @property {Object} [settings] The shared settings.
 */

// export interface OverrideConfigData {
//     env?: Record<string, boolean>;
//     excludedFiles?: string | string[];
//     extends?: string | string[];
//     files?: string | string[];
//     globals?: Record<string, GlobalConf>;
//     noInlineConfig?: boolean;
//     overrides?: OverrideConfigData[];
//     parser?: string | object;
//     parserOptions?: ParserOptions;
//     plugins?: string[];
//     processor?: string;
//     reportUnusedDisableDirectives?: boolean;
//     rules?: Record<string, RuleConf>;
//     settings?: object;
// }

/**
 * @typedef {Object} ParseResult
 * @property {Object} ast The AST.
 * @property {ScopeManager} [scopeManager] The scope manager of the AST.
 * @property {Record<string, any>} [services] The services that the parser provides.
 * @property {Record<string, string[]>} [visitorKeys] The visitor keys of the AST.
 */

// export interface ParseResult {
//     ast: object;
//     scopeManager: ScopeManager;
//     services: Record<string, any>;
//     visitorKeys: Record<string, string[]>;
// }

// export interface ScopeManager {}

/**
 * @typedef {Object} Parser
 * @property {(text:string, options:ParserOptions) => Object} parse The definition of global variables.
 * @property {(text:string, options:ParserOptions) => ParseResult} [parseForESLint] The parser options that will be enabled under this environment.
 */

// {
//     filePath: string;
//     parse: (text: string, options: ParserOptions) => ParseResult;
//     parseForESLint?: (text: string, options: ParserOptions) => ParseResult;
// }

/**
 * @typedef {Object} Environment
 * @property {Record<string, GlobalConf>} [globals] The definition of global variables.
 * @property {ParserOptions} [parserOptions] The parser options that will be enabled under this environment.
 */

// export interface Environment {
//     globals?: Record<string, GlobalConf>;
//     parserOptions?: ParserOptions;
// }

/**
 * @typedef {Object} LintMessage
 * @property {number|undefined} column The 1-based column number.
 * @property {number} [endColumn] The 1-based column number of the end location.
 * @property {number} [endLine] The 1-based line number of the end location.
 * @property {boolean} fatal If `true` then this is a fatal error.
 * @property {{range:[number,number], text:string}} [fix] Information for autofix.
 * @property {number|undefined} line The 1-based line number.
 * @property {string} message The error message.
 * @property {string|null} ruleId The ID of the rule which makes this message.
 * @property {0|1|2} severity The severity of this message.
 * @property {Array<{desc?: string, messageId?: string, fix: {range: [number, number], text: string}}>} [suggestions] Information for suggestions.
 */

// export interface Fix {
//     range: [number, number];
//     text: string;
// }

// export interface LintMessage {
//     column: number;
//     endColumn: number;
//     endLine: number;
//     fatal: boolean;
//     fix?: Fix;
//     line: number;
//     message: string;
//     ruleId: string;
//     severity: 0 | 1 | 2;
//     suggestions?: Array<{
//         desc?: string;
//         messageId?: string;
//         fix: Fix;
//     }>;
// }

/**
 * @typedef {Object} SuppressedLintMessage
 * @property {number|undefined} column The 1-based column number.
 * @property {number} [endColumn] The 1-based column number of the end location.
 * @property {number} [endLine] The 1-based line number of the end location.
 * @property {boolean} fatal If `true` then this is a fatal error.
 * @property {{range:[number,number], text:string}} [fix] Information for autofix.
 * @property {number|undefined} line The 1-based line number.
 * @property {string} message The error message.
 * @property {string|null} ruleId The ID of the rule which makes this message.
 * @property {0|1|2} severity The severity of this message.
 * @property {Array<{kind: string, justification: string}>} suppressions The suppression info.
 * @property {Array<{desc?: string, messageId?: string, fix: {range: [number, number], text: string}}>} [suggestions] Information for suggestions.
 */

export interface SuppressedLintMessage {
    column: number;
    endColumn: number;
    endLine: number;
    fatal: boolean;
    fix?: Fix;
    line: number;
    message: string;
    ruleId: string;
    severity: SeverityNumber;
    suppressions: Array<{ kind: string; justification: string }>;
    suggestions?: Array<{
        desc?: string;
        messageId?: string;
        fix: Fix;
    }>;
}

/**
 * @typedef {Object} SuggestionResult
 * @property {string} desc A short description.
 * @property {string} [messageId] Id referencing a message for the description.
 * @property {{ text: string, range: number[] }} fix fix result info
 */

// export interface SuggestionResult {
//     desc?: string;
//     messageId?: string;
//     fix?: Fix;
// }

/**
 * @typedef {Object} Processor
 * @property {(text:string, filename:string) => Array<string | { text:string, filename:string }>} [preprocess] The function to extract code blocks.
 * @property {(messagesList:LintMessage[][], filename:string) => LintMessage[]} [postprocess] The function to merge messages.
 * @property {boolean} [supportsAutofix] If `true` then it means the processor supports autofix.
 */

// export interface Processor {
//     preprocess?(text: string, filename: string): Array<string | { text: string; filename: string }>;
//     postprocess?(messagesList: LintMessage[], filename: string): LintMessage[];
//     supportsAutofix?: boolean;
// }

/**
 * @typedef {Object} RuleMetaDocs
 * @property {string} description The description of the rule.
 * @property {boolean} recommended If `true` then the rule is included in `eslint:recommended` preset.
 * @property {string} url The URL of the rule documentation.
 */

// {
//     description: string;
//     recommended: boolean;
//     url: string;
// }

/**
 * @typedef {Object} RuleMeta
 * @property {boolean} [deprecated] If `true` then the rule has been deprecated.
 * @property {RuleMetaDocs} docs The document information of the rule.
 * @property {"code"|"whitespace"} [fixable] The autofix type.
 * @property {boolean} [hasSuggestions] If `true` then the rule provides suggestions.
 * @property {Record<string,string>} [messages] The messages the rule reports.
 * @property {string[]} [replacedBy] The IDs of the alternative rules.
 * @property {Array|Object} schema The option schema of the rule.
 * @property {"problem"|"suggestion"|"layout"} type The rule type.
 */

// export interface RuleMeta {
//     deprecated?: boolean;
//     docs?: RuleMetaDocs;
//     fixable?: 'code' | 'whitespace' | 'problem' | 'suggestion' | 'layout';
//     hasSuggestions?: boolean;
//     messages?: Record<string, string>;
//     replacedBy?: string[];
//     schema?: any[] | object;
//     type: 'problem' | 'suggestion' | 'layout';
// }

/**
 * @typedef {Object} Rule
 * @property {Function} create The factory of the rule.
 * @property {RuleMeta} meta The meta data of the rule.
 */

// export type { Rule };

export interface Rule {
    schema?: JSONSchema4;
    meta?: RuleMeta;
    create: (...args: any[]) => any;
}

export interface ReportDescriptor {
    node?: ASTNode;
    loc: SourceLocation;
    messageId?: string;
    message?: string;
    data?: Record<string, string>;
    fix?(fixer: RuleFixer): Fix | Fix[] | IterableIterator<Fix>;
}

/**
 * @typedef {Object} Plugin
 * @property {Record<string, ConfigData>} [configs] The definition of plugin configs.
 * @property {Record<string, Environment>} [environments] The definition of plugin environments.
 * @property {Record<string, Processor>} [processors] The definition of plugin processors.
 * @property {Record<string, Function | Rule>} [rules] The definition of plugin rules.
 */

// export interface Plugin {
//     parsers: Record<string, any>;
//     configs?: Record<string, ConfigData>;
//     environments?: Record<string, Environment>;
//     processors?: Record<string, Processor>;
//     rules?: Record<string, ((...params: any[]) => any) | Rule>;
// }

/**
 * Information of deprecated rules.
 * @typedef {Object} DeprecatedRuleInfo
 * @property {string} ruleId The rule ID.
 * @property {string[]} replacedBy The rule IDs that replace this deprecated rule.
 */

// export interface DeprecatedRuleInfo {
//     ruleId: string;
//     replacedBy: string[];
// }

/**
 * A linting result.
 * @typedef {Object} LintResult
 * @property {string} filePath The path to the file that was linted.
 * @property {LintMessage[]} messages All of the messages for the result.
 * @property {SuppressedLintMessage[]} suppressedMessages All of the suppressed messages for the result.
 * @property {number} errorCount Number of errors for the result.
 * @property {number} fatalErrorCount Number of fatal errors for the result.
 * @property {number} warningCount Number of warnings for the result.
 * @property {number} fixableErrorCount Number of fixable errors for the result.
 * @property {number} fixableWarningCount Number of fixable warnings for the result.
 * @property {string} [source] The source code of the file that was linted.
 * @property {string} [output] The source code of the file that was linted, with as many fixes applied as possible.
 * @property {DeprecatedRuleInfo[]} usedDeprecatedRules The list of used deprecated rules.
 */

export interface LintResult {
    filePath: string;
    messages: LintMessage[];
    suppressedMessages: SuppressedLintMessage[];
    errorCount: number;
    fatalErrorCount: number;
    warningCount: number;
    fixableErrorCount: number;
    fixableWarningCount: number;
    source: string;
    output: string;
    usedDeprecatedRules: DeprecatedRuleInfo[];
}

/**
 * Information provided when the maximum warning threshold is exceeded.
 * @typedef {Object} MaxWarningsExceeded
 * @property {number} maxWarnings Number of warnings to trigger nonzero exit code.
 * @property {number} foundWarnings Number of warnings found while linting.
 */

export interface MaxWarningsExceeded {
    maxWarnings: number;
    foundWarnings: number;
}

/**
 * Metadata about results for formatters.
 * @typedef {Object} ResultsMeta
 * @property {MaxWarningsExceeded} [maxWarningsExceeded] Present if the maxWarnings threshold was exceeded.
 */

export interface ResultsMeta {
    maxWarningsExceeded?: MaxWarningsExceeded;
}

/**
 * A formatter function.
 * @callback FormatterFunction
 * @param {LintResult[]} results The list of linting results.
 * @param {{cwd: string, maxWarningsExceeded?: MaxWarningsExceeded, rulesMeta: Record<string, RuleMeta>}} [context] A context object.
 * @returns {string | Promise<string>} Formatted text.
 */

export interface FormatterFunction {
    (
        results: LintResult[],
        context?: {
            cwd: string;
            maxWarningsExceeded?: MaxWarningsExceeded;
            rulesMeta: Record<string, RuleMeta>;
        }
    ): string | Promise<string>;
}
