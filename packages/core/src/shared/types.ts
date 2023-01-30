import { ASTNode, ParserOptions, ReportDescriptor, ScopeManager, Settings } from "@eslint/types";
import { Variable } from "eslint-scope";

import { SourceCode } from "../source-code";

export interface RuleContext {
    parserOptions: ParserOptions;
    id: string;
    options: unknown[];
    settings: Settings;
    parserPath: string;
    parserServices: Record<string, unknown>;
    getAncestors(): ASTNode[];
    getCwd(): string;
    getDeclaredVariables(node: ASTNode): Variable[];
    getFilename(): string;
    getPhysicalFilename(): string;
    getScope(): ScopeManager;
    getSourceCode(): SourceCode;
    markVariableAsUsed(name: string): boolean;
    report(descriptor: ReportDescriptor): void;
}
