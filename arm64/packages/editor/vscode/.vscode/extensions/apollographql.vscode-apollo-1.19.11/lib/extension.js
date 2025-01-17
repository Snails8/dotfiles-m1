"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path_1 = require("path");
const vscode_1 = require("vscode");
const statusBar_1 = __importDefault(require("./statusBar"));
const languageServerClient_1 = require("./languageServerClient");
const vscode_languageclient_1 = require("vscode-languageclient");
const utils_1 = require("./utils");
const debug_1 = require("./debug");
const { version } = require("../package.json");
let client;
let clientDisposable;
let statusBar;
let outputChannel;
let schemaTagItems = [];
function isError(response) {
    return (typeof response === "object" &&
        response !== null &&
        "message" in response &&
        "stack" in response);
}
function activate(context) {
    const serverModule = context.asAbsolutePath(path_1.join("lib/language-server", "server.js"));
    client = languageServerClient_1.getLanguageServerClient(serverModule, outputChannel);
    client.registerProposedFeatures();
    statusBar = new statusBar_1.default({
        hasActiveTextEditor: Boolean(vscode_1.window.activeTextEditor),
    });
    outputChannel = vscode_1.window.createOutputChannel("Apollo GraphQL");
    debug_1.Debug.SetOutputConsole(outputChannel);
    clientDisposable = client.start();
    context.subscriptions.push(statusBar, outputChannel, clientDisposable);
    var serverDebugMessage = new vscode_languageclient_1.NotificationType("serverDebugMessage");
    client.onReady().then(() => {
        client.onNotification(serverDebugMessage, (message) => {
            switch (message.type) {
                case "info":
                    debug_1.Debug.info(message.message, message.stack);
                    break;
                case "error":
                    debug_1.Debug.error(message.message, message.stack);
                    break;
                case "warning":
                    debug_1.Debug.warning(message.message, message.stack);
                    break;
                default:
                    debug_1.Debug.info(message.message, message.stack);
                    break;
            }
        });
        vscode_1.commands.registerCommand("apollographql/showStats", () => {
            const fileUri = vscode_1.window.activeTextEditor
                ? vscode_1.window.activeTextEditor.document.uri.fsPath
                : null;
            const fileOpen = fileUri && /[\/\\]/.test(fileUri);
            if (fileOpen) {
                client.sendNotification("apollographql/getStats", { uri: fileUri });
                return;
            }
            utils_1.printNoFileOpenMessage(client, version);
            client.outputChannel.show();
        });
        client.onNotification("apollographql/statsLoaded", (params) => {
            utils_1.printStatsToClientOutputChannel(client, params, version);
            client.outputChannel.show();
        });
        client.onNotification("apollographql/configFilesFound", (params) => {
            const response = JSON.parse(params);
            const hasActiveTextEditor = Boolean(vscode_1.window.activeTextEditor);
            if (isError(response)) {
                statusBar.showWarningState({
                    hasActiveTextEditor,
                    tooltip: "Configuration Error",
                });
                outputChannel.append(response.stack);
                const infoButtonText = "More Info";
                vscode_1.window
                    .showInformationMessage(response.message, infoButtonText)
                    .then((clicked) => {
                    if (clicked === infoButtonText) {
                        outputChannel.show();
                    }
                });
            }
            else if (Array.isArray(response)) {
                if (response.length === 0) {
                    statusBar.showWarningState({
                        hasActiveTextEditor,
                        tooltip: "No apollo.config.js file found",
                    });
                }
                else {
                    statusBar.showLoadedState({ hasActiveTextEditor });
                }
            }
            else {
                debug_1.Debug.error(`Invalid response type in message apollographql/configFilesFound:\n${JSON.stringify(response)}`);
            }
        });
        vscode_1.commands.registerCommand("apollographql/reloadService", () => {
            schemaTagItems = [];
            client.sendNotification("apollographql/reloadService");
        });
        client.onNotification("apollographql/tagsLoaded", (params) => {
            const [serviceID, tags] = JSON.parse(params);
            const items = tags.map((tag) => ({
                label: tag,
                description: "",
                detail: serviceID,
            }));
            schemaTagItems = [...items, ...schemaTagItems];
        });
        vscode_1.commands.registerCommand("apollographql/selectSchemaTag", async () => {
            const selection = await vscode_1.window.showQuickPick(schemaTagItems);
            if (selection) {
                client.sendNotification("apollographql/tagSelected", selection);
            }
        });
        let currentLoadingResolve = new Map();
        client.onNotification("apollographql/loadingComplete", (token) => {
            statusBar.showLoadedState({
                hasActiveTextEditor: Boolean(vscode_1.window.activeTextEditor),
            });
            const inMap = currentLoadingResolve.get(token);
            if (inMap) {
                inMap();
                currentLoadingResolve.delete(token);
            }
        });
        client.onNotification("apollographql/loading", ({ message, token }) => {
            vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                title: message,
                cancellable: false,
            }, () => {
                return new Promise((resolve) => {
                    currentLoadingResolve.set(token, resolve);
                });
            });
        });
        const runIconOnDiskPath = vscode_1.Uri.file(path_1.join(context.extensionPath, "images", "IconRun.svg"));
        const textDecorationType = vscode_1.window.createTextEditorDecorationType({});
        const runGlyphDecorationType = vscode_1.window.createTextEditorDecorationType({});
        let latestDecorations = undefined;
        const updateDecorations = () => {
            if (vscode_1.window.activeTextEditor && latestDecorations) {
                const editor = vscode_1.window.activeTextEditor;
                const decorationsForDocument = latestDecorations.filter((decoration) => decoration.document ===
                    vscode_1.window.activeTextEditor.document.uri.toString());
                const textDecorations = decorationsForDocument.flatMap((decoration) => {
                    if (decoration.type !== "text") {
                        return [];
                    }
                    return {
                        range: editor.document.lineAt(decoration.range.start.line).range,
                        renderOptions: {
                            after: {
                                contentText: decoration.message,
                                textDecoration: "none; padding-left: 15px; opacity: .5",
                            },
                        },
                    };
                });
                const runGlyphDecorations = decorationsForDocument.flatMap((decoration) => {
                    if (decoration.type !== "runGlyph") {
                        return [];
                    }
                    const hoverMessage = decoration.hoverMessage === undefined
                        ? undefined
                        : new vscode_1.MarkdownString(decoration.hoverMessage);
                    if (hoverMessage) {
                        hoverMessage.isTrusted = true;
                    }
                    const endOfLinePosition = editor.document.lineAt(decoration.range.start.line).range.end;
                    return {
                        range: new vscode_1.Range(endOfLinePosition, endOfLinePosition),
                        renderOptions: {
                            after: {
                                contentIconPath: runIconOnDiskPath,
                                textDecoration: "none; border-radius: .20rem; margin-left: 8px; text-align: center;",
                                backgroundColor: "#2075D6",
                                width: "18px",
                                height: "18px",
                            },
                        },
                        hoverMessage,
                    };
                });
                vscode_1.window.activeTextEditor.setDecorations(textDecorationType, textDecorations);
                if (vscode_1.workspace
                    .getConfiguration("apollographql")
                    .get("display.showRunInStudioButton")) {
                    vscode_1.window.activeTextEditor.setDecorations(runGlyphDecorationType, runGlyphDecorations);
                }
            }
        };
        client.onNotification("apollographql/engineDecorations", ({ decorations }) => {
            latestDecorations = decorations;
            updateDecorations();
        });
        vscode_1.window.onDidChangeActiveTextEditor(() => {
            updateDecorations();
        });
        vscode_1.workspace.registerTextDocumentContentProvider("graphql-schema", {
            provideTextDocumentContent(uri) {
                return uri.query;
            },
        });
    });
}
exports.activate = activate;
function deactivate() {
    if (client) {
        return client.stop();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map