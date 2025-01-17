"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debug = void 0;
const createAndTrimStackTrace = () => {
    let stack = new Error().stack;
    return stack && stack.split("\n").length > 2
        ? stack.split("\n").slice(3, 7).join("\n")
        : stack;
};
class Debug {
    static SetConnection(conn) {
        Debug.connection = conn;
        Debug.infoLogger = (message) => Debug.connection.sendNotification("serverDebugMessage", {
            type: "info",
            message: message,
        });
        Debug.warningLogger = (message) => Debug.connection.sendNotification("serverDebugMessage", {
            type: "warning",
            message: message,
        });
        Debug.errorLogger = (message) => Debug.connection.sendNotification("serverDebugMessage", {
            type: "error",
            message: message,
        });
    }
    static SetLoggers({ info, warning, error, }) {
        if (info)
            Debug.infoLogger = info;
        if (warning)
            Debug.warningLogger = warning;
        if (error)
            Debug.errorLogger = error;
    }
    static info(message) {
        Debug.infoLogger(message);
    }
    static error(message) {
        const stack = createAndTrimStackTrace();
        Debug.errorLogger(`${message}\n${stack}`);
    }
    static warning(message) {
        Debug.warningLogger(message);
    }
    static sendErrorTelemetry(message) {
        Debug.connection &&
            Debug.connection.sendNotification("serverDebugMessage", {
                type: "errorTelemetry",
                message: message,
            });
    }
}
exports.Debug = Debug;
Debug.infoLogger = (message) => console.log("[INFO] " + message);
Debug.warningLogger = (message) => console.warn("[WARNING] " + message);
Debug.errorLogger = (message) => console.error("[ERROR] " + message);
//# sourceMappingURL=debug.js.map