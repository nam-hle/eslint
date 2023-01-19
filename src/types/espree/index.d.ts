declare module "espree" {
    interface Token {
        type: string;
        value: string;
        start: number;
        end: number;
    }
    declare const latestEcmaVersion: string;
    function tokenize(code: string, options: any): Token[];

    export { tokenize, latestEcmaVersion };
}
