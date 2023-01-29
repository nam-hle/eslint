declare module "eslint-utils" {
    interface SourceLocation {
        source?: string | null | undefined;
        start: Position;
        end: Position;
    }

    interface Position {
        /** >= 1 */
        line: number;
        /** >= 0 */
        column: number;
    }
    interface Token {
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
    function isCommentToken(token: Token | Comment): token is Comment;

    export { isCommentToken };
}
