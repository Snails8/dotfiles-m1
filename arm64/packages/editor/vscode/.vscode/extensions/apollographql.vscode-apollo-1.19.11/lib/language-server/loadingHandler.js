"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageServerLoadingHandler = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
class LanguageServerLoadingHandler {
    constructor(connection) {
        this.connection = connection;
        this.latestLoadingToken = 0;
    }
    async handle(message, value) {
        const token = this.latestLoadingToken;
        this.latestLoadingToken += 1;
        this.connection.sendNotification(new vscode_languageserver_1.NotificationType("apollographql/loading"), { message, token });
        try {
            const ret = await value;
            this.connection.sendNotification(new vscode_languageserver_1.NotificationType("apollographql/loadingComplete"), token);
            return ret;
        }
        catch (e) {
            this.connection.sendNotification(new vscode_languageserver_1.NotificationType("apollographql/loadingComplete"), token);
            this.showError(`Error in "${message}": ${e}`);
            throw e;
        }
    }
    handleSync(message, value) {
        const token = this.latestLoadingToken;
        this.latestLoadingToken += 1;
        this.connection.sendNotification(new vscode_languageserver_1.NotificationType("apollographql/loading"), { message, token });
        try {
            const ret = value();
            this.connection.sendNotification(new vscode_languageserver_1.NotificationType("apollographql/loadingComplete"), token);
            return ret;
        }
        catch (e) {
            this.connection.sendNotification(new vscode_languageserver_1.NotificationType("apollographql/loadingComplete"), token);
            this.showError(`Error in "${message}": ${e}`);
            throw e;
        }
    }
    showError(message) {
        this.connection.window.showErrorMessage(message);
    }
}
exports.LanguageServerLoadingHandler = LanguageServerLoadingHandler;
//# sourceMappingURL=loadingHandler.js.map