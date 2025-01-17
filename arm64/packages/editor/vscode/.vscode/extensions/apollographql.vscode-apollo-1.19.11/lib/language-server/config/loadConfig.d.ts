import { ApolloConfig } from "./config";
export declare const legacyKeyEnvVar = "ENGINE_API_KEY";
export declare const keyEnvVar = "APOLLO_KEY";
export interface LoadConfigSettings {
    configPath?: string;
    configFileName?: string;
    requireConfig?: boolean;
    name?: string;
    type?: "service" | "client";
}
export declare type ConfigResult<T> = {
    config: T;
    filepath: string;
} | null;
export declare function loadConfig({ configPath, configFileName, requireConfig, name, type, }: LoadConfigSettings): Promise<ApolloConfig | null>;
//# sourceMappingURL=loadConfig.d.ts.map