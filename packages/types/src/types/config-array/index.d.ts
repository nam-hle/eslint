declare module "@humanwhocodes/config-array" {
    import { JSONSchema4 } from "json-schema";

    export class ConfigArray extends Array {
        constructor(
            config: any,
            options?: { basePath?: string; normalized?: boolean; schema?: JSONSchema4; extraConfigTypes?: string[] }
        ) {}

        [Symbol("preprocessConfig")](config: any);
    }
    export declare const ConfigArraySymbol: {
        isNormalized: symbol;
        configCache: symbol;
        schema: symbol;
        finalizeConfig: symbol;
        preprocessConfig: symbol;
    };
}
