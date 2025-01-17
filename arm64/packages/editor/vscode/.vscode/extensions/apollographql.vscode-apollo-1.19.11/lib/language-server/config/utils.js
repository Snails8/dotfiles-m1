"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseServiceSpecifier = exports.getGraphIdFromConfig = exports.getServiceFromKey = exports.isServiceKey = exports.isServiceConfig = exports.isLocalServiceConfig = exports.isClientConfig = void 0;
function isClientConfig(config) {
    return config.isClient;
}
exports.isClientConfig = isClientConfig;
function isLocalServiceConfig(config) {
    return !!config.localSchemaFile;
}
exports.isLocalServiceConfig = isLocalServiceConfig;
function isServiceConfig(config) {
    return config.isService;
}
exports.isServiceConfig = isServiceConfig;
function isServiceKey(key) {
    return key && /service:.*:.*/.test(key);
}
exports.isServiceKey = isServiceKey;
function getServiceFromKey(key) {
    if (key) {
        const [type, service] = key.split(":");
        if (type === "service")
            return service;
    }
    return;
}
exports.getServiceFromKey = getServiceFromKey;
function getGraphIdFromConfig(config) {
    if (config.service && config.service.name)
        return parseServiceSpecifier(config.service.name)[0];
    if (config.client) {
        if (typeof config.client.service === "string") {
            return parseServiceSpecifier(config.client.service)[0];
        }
        return config.client.service && config.client.service.name;
    }
    else {
        return undefined;
    }
}
exports.getGraphIdFromConfig = getGraphIdFromConfig;
function parseServiceSpecifier(specifier) {
    const [id, tag] = specifier.split("@").map((x) => x.trim());
    return [id, tag];
}
exports.parseServiceSpecifier = parseServiceSpecifier;
//# sourceMappingURL=utils.js.map