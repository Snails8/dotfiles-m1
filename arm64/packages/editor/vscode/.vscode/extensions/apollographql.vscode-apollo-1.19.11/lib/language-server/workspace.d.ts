import { WorkspaceFolder, NotificationHandler, PublishDiagnosticsParams } from "vscode-languageserver";
import { QuickPickItem } from "vscode";
import { GraphQLProject, DocumentUri } from "./project/base";
import { ApolloConfig } from "./config";
import { LanguageServerLoadingHandler } from "./loadingHandler";
import { ServiceID, SchemaTag, ClientIdentity } from "./engine";
import type { EngineDecoration } from "src/messages";
export interface WorkspaceConfig {
    clientIdentity?: ClientIdentity;
}
export declare class GraphQLWorkspace {
    private LanguageServerLoadingHandler;
    private config;
    private _onDiagnostics?;
    private _onDecorations?;
    private _onSchemaTags?;
    private _onConfigFilesFound?;
    private _projectForFileCache;
    private projectsByFolderUri;
    constructor(LanguageServerLoadingHandler: LanguageServerLoadingHandler, config: WorkspaceConfig);
    onDiagnostics(handler: NotificationHandler<PublishDiagnosticsParams>): void;
    onDecorations(handler: NotificationHandler<EngineDecoration[]>): void;
    onSchemaTags(handler: NotificationHandler<[ServiceID, SchemaTag[]]>): void;
    onConfigFilesFound(handler: NotificationHandler<ApolloConfig[]>): void;
    private createProject;
    addProjectsInFolder(folder: WorkspaceFolder): Promise<void>;
    reloadService(): void;
    reloadProjectForConfig(configUri: DocumentUri): Promise<void>;
    updateSchemaTag(selection: QuickPickItem): void;
    removeProjectsInFolder(folder: WorkspaceFolder): void;
    get projects(): GraphQLProject[];
    projectForFile(uri: DocumentUri): GraphQLProject | undefined;
}
//# sourceMappingURL=workspace.d.ts.map