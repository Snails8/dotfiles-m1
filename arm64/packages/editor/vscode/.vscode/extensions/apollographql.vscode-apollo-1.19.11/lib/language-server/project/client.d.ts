import { GraphQLProject } from "./base";
import { GraphQLSchema, FragmentDefinitionNode, FragmentSpreadNode, OperationDefinitionNode, DocumentNode, FieldNode, ObjectTypeDefinitionNode, DefinitionNode, ExecutableDefinitionNode } from "graphql";
import { NotificationHandler } from "vscode-languageserver";
import { LoadingHandler } from "../loadingHandler";
import { SchemaTag, ServiceID, ClientIdentity } from "../engine";
import { ClientConfig } from "../config";
import { DiagnosticSet } from "../diagnostics";
import URI from "vscode-uri";
export declare function isClientProject(project: GraphQLProject): project is GraphQLClientProject;
export interface GraphQLClientProjectConfig {
    clientIdentity?: ClientIdentity;
    config: ClientConfig;
    configFolderURI: URI;
    loadingHandler: LoadingHandler;
}
export declare class GraphQLClientProject extends GraphQLProject {
    serviceID?: string;
    config: ClientConfig;
    private serviceSchema?;
    private _onDecorations?;
    private _onSchemaTags?;
    private fieldLatenciesMS?;
    private frontendUrlRoot?;
    private _validationRules?;
    diagnosticSet?: DiagnosticSet;
    constructor({ config, loadingHandler, configFolderURI, clientIdentity, }: GraphQLClientProjectConfig);
    get displayName(): string;
    initialize(): Promise<void>[];
    getProjectStats(): {
        type: string;
        serviceId: string | undefined;
        types: {
            service: number;
            client: number;
            total: number;
        };
        tag: string;
        loaded: boolean;
        lastFetch: number | undefined;
    };
    onDecorations(handler: (any: any) => void): void;
    onSchemaTags(handler: NotificationHandler<[ServiceID, SchemaTag[]]>): void;
    updateSchemaTag(tag: SchemaTag): Promise<void>;
    private loadServiceSchema;
    resolveSchema(): Promise<GraphQLSchema>;
    get clientSchema(): DocumentNode;
    get missingApolloClientDirectives(): readonly DefinitionNode[];
    private addClientMetadataToSchemaNodes;
    validate(): Promise<void>;
    loadEngineData(): Promise<void>;
    generateDecorations(): void;
    get fragments(): {
        [fragmentName: string]: FragmentDefinitionNode;
    };
    get operations(): {
        [operationName: string]: OperationDefinitionNode;
    };
    get mergedOperationsAndFragments(): {
        [operationName: string]: DocumentNode;
    };
    get mergedOperationsAndFragmentsForService(): {
        [operationName: string]: DocumentNode;
    };
    getOperationFieldsFromFieldDefinition(fieldName: string, parent: ObjectTypeDefinitionNode | null): FieldNode[];
    fragmentSpreadsForFragment(fragmentName: string): FragmentSpreadNode[];
    getOperationWithFragments(operationDefinition: OperationDefinitionNode): ExecutableDefinitionNode[];
}
//# sourceMappingURL=client.d.ts.map