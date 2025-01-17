"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticSet = exports.GraphQLDiagnostic = exports.diagnosticsFromError = exports.collectExecutableDefinitionDiagnositics = void 0;
const graphql_1 = require("graphql");
const vscode_languageserver_1 = require("vscode-languageserver");
const graphql_2 = require("./utilities/graphql");
const source_1 = require("./utilities/source");
const validation_1 = require("./errors/validation");
function collectExecutableDefinitionDiagnositics(schema, queryDocument, fragments = {}, rules) {
    const ast = queryDocument.ast;
    if (!ast)
        return queryDocument.syntaxErrors;
    const astWithExecutableDefinitions = Object.assign(Object.assign({}, ast), { definitions: ast.definitions.filter(graphql_1.isExecutableDefinitionNode) });
    const diagnostics = [];
    for (const error of validation_1.getValidationErrors(schema, astWithExecutableDefinitions, fragments, rules)) {
        diagnostics.push(...diagnosticsFromError(error, vscode_languageserver_1.DiagnosticSeverity.Error, "Validation"));
    }
    for (const error of graphql_1.findDeprecatedUsages(schema, astWithExecutableDefinitions)) {
        diagnostics.push(...diagnosticsFromError(error, vscode_languageserver_1.DiagnosticSeverity.Warning, "Deprecation"));
    }
    return diagnostics;
}
exports.collectExecutableDefinitionDiagnositics = collectExecutableDefinitionDiagnositics;
function diagnosticsFromError(error, severity, type) {
    if (!error.nodes) {
        return [];
    }
    return error.nodes.map((node) => {
        return {
            source: `GraphQL: ${type}`,
            message: error.message,
            severity,
            range: source_1.rangeForASTNode(graphql_2.highlightNodeForNode(node) || node),
            error,
        };
    });
}
exports.diagnosticsFromError = diagnosticsFromError;
var GraphQLDiagnostic;
(function (GraphQLDiagnostic) {
    function is(diagnostic) {
        return "error" in diagnostic;
    }
    GraphQLDiagnostic.is = is;
})(GraphQLDiagnostic = exports.GraphQLDiagnostic || (exports.GraphQLDiagnostic = {}));
class DiagnosticSet {
    constructor() {
        this.diagnosticsByFile = new Map();
    }
    entries() {
        return this.diagnosticsByFile.entries();
    }
    addDiagnostics(uri, diagnostics) {
        const existingDiagnostics = this.diagnosticsByFile.get(uri);
        if (!existingDiagnostics) {
            this.diagnosticsByFile.set(uri, diagnostics);
        }
        else {
            existingDiagnostics.push(...diagnostics);
        }
    }
}
exports.DiagnosticSet = DiagnosticSet;
//# sourceMappingURL=diagnostics.js.map