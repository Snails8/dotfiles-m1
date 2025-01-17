"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../env");
require("../env/fetch/global");
const vscode_languageserver_1 = require("vscode-languageserver");
const workspace_1 = require("./workspace");
const languageProvider_1 = require("./languageProvider");
const loadingHandler_1 = require("./loadingHandler");
const utilities_1 = require("./utilities");
const vscode_uri_1 = __importDefault(require("vscode-uri"));
const connection = vscode_languageserver_1.createConnection(vscode_languageserver_1.ProposedFeatures.all);
utilities_1.Debug.SetConnection(connection);
let hasWorkspaceFolderCapability = false;
let initializeConnection;
const whenConnectionInitialized = new Promise((resolve) => (initializeConnection = resolve));
const workspace = new workspace_1.GraphQLWorkspace(new loadingHandler_1.LanguageServerLoadingHandler(connection), {
    clientIdentity: {
        name: process.env["APOLLO_CLIENT_NAME"],
        version: process.env["APOLLO_CLIENT_VERSION"],
        referenceID: process.env["APOLLO_CLIENT_REFERENCE_ID"],
    },
});
workspace.onDiagnostics((params) => {
    connection.sendDiagnostics(params);
});
workspace.onDecorations((params) => {
    connection.sendNotification("apollographql/engineDecorations", {
        decorations: params,
    });
});
workspace.onSchemaTags((params) => {
    connection.sendNotification("apollographql/tagsLoaded", JSON.stringify(params));
});
workspace.onConfigFilesFound(async (params) => {
    await whenConnectionInitialized;
    connection.sendNotification("apollographql/configFilesFound", params instanceof Error
        ?
            JSON.stringify({ message: params.message, stack: params.stack })
        : JSON.stringify(params));
});
connection.onInitialize(async ({ capabilities, workspaceFolders }) => {
    hasWorkspaceFolderCapability = !!(capabilities.workspace && capabilities.workspace.workspaceFolders);
    if (workspaceFolders) {
        await Promise.all(workspaceFolders.map((folder) => workspace.addProjectsInFolder(folder)));
    }
    return {
        capabilities: {
            hoverProvider: true,
            completionProvider: {
                resolveProvider: false,
                triggerCharacters: ["...", "@"],
            },
            definitionProvider: true,
            referencesProvider: true,
            documentSymbolProvider: true,
            workspaceSymbolProvider: true,
            codeLensProvider: {
                resolveProvider: false,
            },
            codeActionProvider: true,
            executeCommandProvider: {
                commands: [],
            },
            textDocumentSync: documents.syncKind,
        },
    };
});
connection.onInitialized(async () => {
    initializeConnection();
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(async (event) => {
            await Promise.all([
                ...event.removed.map((folder) => workspace.removeProjectsInFolder(folder)),
                ...event.added.map((folder) => workspace.addProjectsInFolder(folder)),
            ]);
        });
    }
});
const documents = new vscode_languageserver_1.TextDocuments();
documents.listen(connection);
function isFile(uri) {
    return vscode_uri_1.default.parse(uri).scheme === "file";
}
documents.onDidChangeContent(utilities_1.debounceHandler((params) => {
    const project = workspace.projectForFile(params.document.uri);
    if (!project)
        return;
    if (!isFile(params.document.uri)) {
        return;
    }
    project.documentDidChange(params.document);
}));
connection.onDidChangeWatchedFiles((params) => {
    for (const { uri, type } of params.changes) {
        if (uri.endsWith("apollo.config.js") ||
            uri.endsWith("apollo.config.cjs") ||
            uri.endsWith(".env")) {
            workspace.reloadProjectForConfig(uri);
        }
        if (type === vscode_languageserver_1.FileChangeType.Changed) {
            continue;
        }
        if (!isFile(uri)) {
            continue;
        }
        const project = workspace.projectForFile(uri);
        if (!project)
            continue;
        switch (type) {
            case vscode_languageserver_1.FileChangeType.Created:
                project.fileDidChange(uri);
                break;
            case vscode_languageserver_1.FileChangeType.Deleted:
                project.fileWasDeleted(uri);
                break;
        }
    }
});
const languageProvider = new languageProvider_1.GraphQLLanguageProvider(workspace);
connection.onHover((params, token) => languageProvider.provideHover(params.textDocument.uri, params.position, token));
connection.onDefinition((params, token) => languageProvider.provideDefinition(params.textDocument.uri, params.position, token));
connection.onReferences((params, token) => languageProvider.provideReferences(params.textDocument.uri, params.position, params.context, token));
connection.onDocumentSymbol((params, token) => languageProvider.provideDocumentSymbol(params.textDocument.uri, token));
connection.onWorkspaceSymbol((params, token) => languageProvider.provideWorkspaceSymbol(params.query, token));
connection.onCompletion(utilities_1.debounceHandler((params, token) => languageProvider.provideCompletionItems(params.textDocument.uri, params.position, token)));
connection.onCodeLens(utilities_1.debounceHandler((params, token) => languageProvider.provideCodeLenses(params.textDocument.uri, token)));
connection.onCodeAction(utilities_1.debounceHandler((params, token) => languageProvider.provideCodeAction(params.textDocument.uri, params.range, token)));
connection.onNotification("apollographql/reloadService", () => workspace.reloadService());
connection.onNotification("apollographql/tagSelected", (selection) => workspace.updateSchemaTag(selection));
connection.onNotification("apollographql/getStats", async ({ uri }) => {
    const status = await languageProvider.provideStats(uri);
    connection.sendNotification("apollographql/statsLoaded", status);
});
connection.listen();
//# sourceMappingURL=server.js.map