import { ClientID, ServiceID, ServiceSpecifier } from "../engine";
import URI from "vscode-uri";
import { WithRequired } from "../../env";
import { ValidationRule } from "graphql/validation/ValidationContext";
export interface EngineStatsWindow {
    to: number;
    from: number;
}
export declare const DefaultEngineStatsWindow: {
    to: number;
    from: number;
};
export interface HistoricalEngineStatsWindow extends EngineStatsWindow {
}
export declare type EndpointURI = string;
export interface RemoteServiceConfig {
    name: ServiceID;
    url: EndpointURI;
    headers?: {
        [key: string]: string;
    };
    skipSSLValidation?: boolean;
}
export interface LocalServiceConfig {
    name: ServiceID;
    localSchemaFile: string | string[];
}
export interface EngineConfig {
    endpoint?: EndpointURI;
    readonly apiKey?: string;
}
export declare const DefaultEngineConfig: {
    endpoint: string;
};
export declare const DefaultConfigBase: {
    includes: string[];
    excludes: string[];
};
export interface ConfigBase {
    includes: string[];
    excludes: string[];
}
export declare type ClientServiceConfig = RemoteServiceConfig | LocalServiceConfig;
export interface ClientConfigFormat extends ConfigBase {
    service?: ServiceSpecifier | ClientServiceConfig;
    name?: ClientID;
    referenceID?: string;
    version?: string;
    clientOnlyDirectives?: string[];
    clientSchemaDirectives?: string[];
    addTypename?: boolean;
    tagName?: string;
    statsWindow?: EngineStatsWindow;
    validationRules?: ValidationRule[] | ((rule: ValidationRule) => boolean);
}
export declare const DefaultClientConfig: {
    tagName: string;
    clientOnlyDirectives: string[];
    clientSchemaDirectives: string[];
    addTypename: boolean;
    statsWindow: {
        to: number;
        from: number;
    };
    includes: string[];
    excludes: string[];
};
export interface ServiceConfigFormat extends ConfigBase {
    name?: string;
    endpoint?: Exclude<RemoteServiceConfig, "name">;
    localSchemaFile?: string | string[];
}
export declare const DefaultServiceConfig: {
    endpoint: {
        url: string;
    };
    includes: string[];
    excludes: string[];
};
export interface ConfigBaseFormat {
    client?: ClientConfigFormat;
    service?: ServiceConfigFormat;
    engine?: EngineConfig;
}
export declare type ApolloConfigFormat = WithRequired<ConfigBaseFormat, "client"> | WithRequired<ConfigBaseFormat, "service">;
export declare class ApolloConfig {
    rawConfig: ApolloConfigFormat;
    configURI?: URI | undefined;
    isClient: boolean;
    isService: boolean;
    engine: EngineConfig;
    service?: ServiceConfigFormat;
    client?: ClientConfigFormat;
    private _variant?;
    private _graphId?;
    constructor(rawConfig: ApolloConfigFormat, configURI?: URI | undefined);
    get configDirURI(): URI | undefined;
    get projects(): (ClientConfig | ServiceConfig)[];
    set variant(variant: string);
    get variant(): string;
    set graph(graphId: string | undefined);
    get graph(): string | undefined;
    setDefaults({ engine, client, service, }: {
        engine?: EngineConfig;
        client?: ClientConfigFormat;
        service?: ServiceConfigFormat;
    }): void;
}
export declare class ClientConfig extends ApolloConfig {
    client: ClientConfigFormat;
    isClient: true;
    isService: false;
}
export declare class ServiceConfig extends ApolloConfig {
    service: ServiceConfigFormat;
    isClient: false;
    isService: true;
}
//# sourceMappingURL=config.d.ts.map