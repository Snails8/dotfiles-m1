"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGraphQLDocuments = exports.GraphQLDocument = void 0;
const graphql_1 = require("graphql");
const location_1 = require("graphql/language/location");
const vscode_languageserver_1 = require("vscode-languageserver");
const getDiagnostics_1 = require("graphql-language-service-interface/dist/getDiagnostics");
const source_1 = require("./utilities/source");
class GraphQLDocument {
    constructor(source) {
        this.source = source;
        this.syntaxErrors = [];
        try {
            this.ast = graphql_1.parse(source);
        }
        catch (error) {
            if (maybeCommentedOut(source.body))
                return;
            const range = source_1.rangeInContainingDocument(source, getDiagnostics_1.getRange(error.locations[0], source.body));
            this.syntaxErrors.push({
                severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                message: error.message,
                source: "GraphQL: Syntax",
                range,
            });
        }
    }
    containsPosition(position) {
        if (position.line < this.source.locationOffset.line - 1)
            return false;
        const end = source_1.positionFromSourceLocation(this.source, location_1.getLocation(this.source, this.source.body.length));
        return position.line <= end.line;
    }
}
exports.GraphQLDocument = GraphQLDocument;
function extractGraphQLDocuments(document, tagName = "gql") {
    switch (document.languageId) {
        case "graphql":
            return [
                new GraphQLDocument(new graphql_1.Source(document.getText(), document.uri)),
            ];
        case "javascript":
        case "javascriptreact":
        case "typescript":
        case "typescriptreact":
        case "vue":
        case "svelte":
            return extractGraphQLDocumentsFromJSTemplateLiterals(document, tagName);
        case "python":
            return extractGraphQLDocumentsFromPythonStrings(document, tagName);
        case "ruby":
            return extractGraphQLDocumentsFromRubyStrings(document, tagName);
        case "dart":
            return extractGraphQLDocumentsFromDartStrings(document, tagName);
        case "reason":
            return extractGraphQLDocumentsFromReasonStrings(document, tagName);
        case "elixir":
            return extractGraphQLDocumentsFromElixirStrings(document, tagName);
        default:
            return null;
    }
}
exports.extractGraphQLDocuments = extractGraphQLDocuments;
function extractGraphQLDocumentsFromJSTemplateLiterals(document, tagName) {
    const text = document.getText();
    const documents = [];
    const regExp = new RegExp(`(?:${tagName}\\s*\`|\`#graphql)([\\s\\S]+?)\``, "gm");
    let result;
    while ((result = regExp.exec(text)) !== null) {
        const contents = replacePlaceholdersWithWhiteSpace(result[1]);
        const position = document.positionAt(result.index + (tagName.length + 1));
        const locationOffset = {
            line: position.line + 1,
            column: position.character + 1,
        };
        const source = new graphql_1.Source(contents, document.uri, locationOffset);
        documents.push(new GraphQLDocument(source));
    }
    if (documents.length < 1)
        return null;
    return documents;
}
function extractGraphQLDocumentsFromPythonStrings(document, tagName) {
    const text = document.getText();
    const documents = [];
    const regExp = new RegExp(`\\b(${tagName}\\s*\\(\\s*[bfru]*("(?:"")?|'(?:'')?))([\\s\\S]+?)\\2\\s*\\)`, "gm");
    let result;
    while ((result = regExp.exec(text)) !== null) {
        const contents = replacePlaceholdersWithWhiteSpace(result[3]);
        const position = document.positionAt(result.index + result[1].length);
        const locationOffset = {
            line: position.line + 1,
            column: position.character + 1,
        };
        const source = new graphql_1.Source(contents, document.uri, locationOffset);
        documents.push(new GraphQLDocument(source));
    }
    if (documents.length < 1)
        return null;
    return documents;
}
function extractGraphQLDocumentsFromRubyStrings(document, tagName) {
    const text = document.getText();
    const documents = [];
    const regExp = new RegExp(`(<<-${tagName})([\\s\\S]+?)${tagName}`, "gm");
    let result;
    while ((result = regExp.exec(text)) !== null) {
        const contents = replacePlaceholdersWithWhiteSpace(result[2]);
        const position = document.positionAt(result.index + result[1].length);
        const locationOffset = {
            line: position.line + 1,
            column: position.character + 1,
        };
        const source = new graphql_1.Source(contents, document.uri, locationOffset);
        documents.push(new GraphQLDocument(source));
    }
    if (documents.length < 1)
        return null;
    return documents;
}
function extractGraphQLDocumentsFromDartStrings(document, tagName) {
    const text = document.getText();
    const documents = [];
    const regExp = new RegExp(`\\b(${tagName}\\(\\s*r?("""|'''))([\\s\\S]+?)\\2\\s*\\)`, "gm");
    let result;
    while ((result = regExp.exec(text)) !== null) {
        const contents = replacePlaceholdersWithWhiteSpace(result[3]);
        const position = document.positionAt(result.index + result[1].length);
        const locationOffset = {
            line: position.line + 1,
            column: position.character + 1,
        };
        const source = new graphql_1.Source(contents, document.uri, locationOffset);
        documents.push(new GraphQLDocument(source));
    }
    if (documents.length < 1)
        return null;
    return documents;
}
function extractGraphQLDocumentsFromReasonStrings(document, tagName) {
    const text = document.getText();
    const documents = [];
    const reasonFileFilter = new RegExp(/(\[%(graphql|relay\.))/g);
    if (!reasonFileFilter.test(text)) {
        return documents;
    }
    const reasonRegexp = new RegExp(/(?<=\[%(graphql|relay\.\w*)[\s\S]*{\|)[.\s\S]+?(?=\|})/gm);
    let result;
    while ((result = reasonRegexp.exec(text)) !== null) {
        const contents = result[0];
        const position = document.positionAt(result.index);
        const locationOffset = {
            line: position.line + 1,
            column: position.character + 1,
        };
        const source = new graphql_1.Source(contents, document.uri, locationOffset);
        documents.push(new GraphQLDocument(source));
    }
    if (documents.length < 1)
        return null;
    return documents;
}
function extractGraphQLDocumentsFromElixirStrings(document, tagName) {
    const text = document.getText();
    const documents = [];
    const regExp = new RegExp(`\\b(${tagName}\\(\\s*r?("""))([\\s\\S]+?)\\2\\s*\\)`, "gm");
    let result;
    while ((result = regExp.exec(text)) !== null) {
        const contents = replacePlaceholdersWithWhiteSpace(result[3]);
        const position = document.positionAt(result.index + result[1].length);
        const locationOffset = {
            line: position.line + 1,
            column: position.character + 1,
        };
        const source = new graphql_1.Source(contents, document.uri, locationOffset);
        documents.push(new GraphQLDocument(source));
    }
    if (documents.length < 1)
        return null;
    return documents;
}
function replacePlaceholdersWithWhiteSpace(content) {
    return content.replace(/\$\{([\s\S]+?)\}/gm, (match) => {
        return Array(match.length).join(" ");
    });
}
function maybeCommentedOut(content) {
    return ((content.indexOf("/*") > -1 && content.indexOf("*/") > -1) ||
        content.split("//").length > 1);
}
//# sourceMappingURL=document.js.map