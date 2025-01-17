"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSchemaProvider = void 0;
const graphql_1 = require("graphql");
const fs_1 = require("fs");
const path_1 = require("path");
const utilities_1 = require("../../utilities");
const apollo_graphql_1 = require("apollo-graphql");
const federation_1 = require("@apollo/federation");
const vscode_uri_1 = __importDefault(require("vscode-uri"));
class FileSchemaProvider {
    constructor(config) {
        this.config = config;
    }
    async resolveSchema() {
        if (this.schema)
            return this.schema;
        const { path, paths } = this.config;
        const documents = path
            ? [this.loadFileAndGetDocument(path)]
            : paths
                ? paths.map(this.loadFileAndGetDocument, this)
                : undefined;
        if (!documents)
            throw new Error(`Schema could not be loaded for [${path ? path : paths ? paths.join(", ") : "undefined"}]`);
        this.schema = apollo_graphql_1.buildSchemaFromSDL(documents);
        if (!this.schema)
            throw new Error(`Schema could not be loaded for ${path}`);
        return this.schema;
    }
    loadFileAndGetDocument(path) {
        let result;
        try {
            result = fs_1.readFileSync(path, {
                encoding: "utf-8",
            });
        }
        catch (err) {
            throw new Error(`Unable to read file ${path}. ${err.message}`);
        }
        const ext = path_1.extname(path);
        if (ext === ".json") {
            const parsed = JSON.parse(result);
            const __schema = parsed.data
                ? parsed.data.__schema
                : parsed.__schema
                    ? parsed.__schema
                    : parsed;
            const schema = graphql_1.buildClientSchema({ __schema });
            return graphql_1.parse(graphql_1.printSchema(schema));
        }
        else if (ext === ".graphql" || ext === ".graphqls" || ext === ".gql") {
            const uri = vscode_uri_1.default.file(path_1.resolve(path)).toString();
            return graphql_1.parse(new graphql_1.Source(result, uri));
        }
        throw new Error("File Type not supported for schema loading. Must be a .json, .graphql, .gql, or .graphqls file");
    }
    onSchemaChange(_handler) {
        throw new Error("File watching not implemented yet");
        return () => { };
    }
    async resolveFederatedServiceSDL() {
        if (this.federatedServiceSDL)
            return this.federatedServiceSDL;
        const { path, paths } = this.config;
        const SDLs = path
            ? [this.loadFileAndGetSDL(path)]
            : paths
                ? paths.map(this.loadFileAndGetSDL, this)
                : undefined;
        if (!SDLs || SDLs.filter((s) => !Boolean(s)).length > 0)
            return utilities_1.Debug.error(`SDL could not be loaded for one of more files: [${path ? path : paths ? paths.join(", ") : "undefined"}]`);
        const federatedSchema = federation_1.buildFederatedSchema(SDLs.map((sdl) => ({ typeDefs: graphql_1.parse(sdl) })));
        const queryType = federatedSchema.getQueryType();
        if (!queryType)
            return utilities_1.Debug.error("No query type found for federated schema");
        const serviceField = queryType.getFields()["_service"];
        const serviceResults = serviceField &&
            serviceField.resolve &&
            serviceField.resolve(null, {}, null, {});
        if (!serviceResults || !serviceResults.sdl)
            return utilities_1.Debug.error("No SDL resolver or result from federated schema after building");
        this.federatedServiceSDL = serviceResults.sdl;
        return this.federatedServiceSDL;
    }
    loadFileAndGetSDL(path) {
        let result;
        try {
            result = fs_1.readFileSync(path, {
                encoding: "utf-8",
            });
        }
        catch (err) {
            return utilities_1.Debug.error(`Unable to read file ${path}. ${err.message}`);
        }
        const ext = path_1.extname(path);
        if (ext === ".graphql" || ext === ".graphqls" || ext === ".gql") {
            return result;
        }
        else {
            return utilities_1.Debug.error("When using localSchemaFile to check or push a federated service, you can only use .graphql, .gql, and .graphqls files");
        }
    }
}
exports.FileSchemaProvider = FileSchemaProvider;
//# sourceMappingURL=file.js.map