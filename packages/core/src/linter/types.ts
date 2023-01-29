import { ASTNode } from "../estree";
import { Fix, Token } from "../shared/types";

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
