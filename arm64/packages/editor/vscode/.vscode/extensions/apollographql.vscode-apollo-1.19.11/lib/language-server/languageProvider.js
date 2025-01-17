"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLLanguageProvider = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const graphql_language_service_interface_1 = require("graphql-language-service-interface");
const graphql_language_service_utils_1 = require("graphql-language-service-utils");
const getAutocompleteSuggestions_1 = require("graphql-language-service-interface/dist/getAutocompleteSuggestions");
const source_1 = require("./utilities/source");
const graphql_1 = require("graphql");
const graphql_2 = require("./utilities/graphql");
const client_1 = require("./project/client");
const tools_1 = require("../tools");
const diagnostics_1 = require("./diagnostics");
const graphql_3 = require("graphql");
const DirectiveLocations = Object.keys(graphql_1.DirectiveLocation);
function hasFields(type) {
    return (graphql_1.isObjectType(type) ||
        (graphql_1.isListType(type) && hasFields(type.ofType)) ||
        (graphql_1.isNonNullType(type) && hasFields(type.ofType)));
}
function uriForASTNode(node) {
    const uri = node.loc && node.loc.source && node.loc.source.name;
    if (!uri || uri === "GraphQL") {
        return null;
    }
    return uri;
}
function locationForASTNode(node) {
    const uri = uriForASTNode(node);
    if (!uri)
        return null;
    return vscode_languageserver_1.Location.create(uri, source_1.rangeForASTNode(node));
}
function symbolForFieldDefinition(definition) {
    return {
        name: definition.name.value,
        kind: vscode_languageserver_1.SymbolKind.Field,
        range: source_1.rangeForASTNode(definition),
        selectionRange: source_1.rangeForASTNode(definition),
    };
}
class GraphQLLanguageProvider {
    constructor(workspace) {
        this.workspace = workspace;
    }
    async provideStats(uri) {
        if (this.workspace.projects.length && uri) {
            const project = this.workspace.projectForFile(uri);
            return project ? project.getProjectStats() : { loaded: false };
        }
        return { loaded: false };
    }
    async provideCompletionItems(uri, position, _token) {
        const project = this.workspace.projectForFile(uri);
        if (!(project && project instanceof client_1.GraphQLClientProject))
            return [];
        const document = project.documentAt(uri, position);
        if (!document)
            return [];
        if (!project.schema)
            return [];
        const rawPositionInDocument = source_1.positionFromPositionInContainingDocument(document.source, position);
        const positionInDocument = new graphql_language_service_utils_1.Position(rawPositionInDocument.line, rawPositionInDocument.character);
        const token = getAutocompleteSuggestions_1.getTokenAtPosition(document.source.body, positionInDocument);
        const state = token.state.kind === "Invalid" ? token.state.prevState : token.state;
        const typeInfo = getAutocompleteSuggestions_1.getTypeInfo(project.schema, token.state);
        if ((state === null || state === void 0 ? void 0 : state.kind) === "DirectiveDef") {
            return DirectiveLocations.map((location) => ({
                label: location,
                kind: vscode_languageserver_1.CompletionItemKind.Constant,
            }));
        }
        const suggestions = graphql_language_service_interface_1.getAutocompleteSuggestions(project.schema, document.source.body, positionInDocument);
        if ((state === null || state === void 0 ? void 0 : state.kind) === "SelectionSet" ||
            (state === null || state === void 0 ? void 0 : state.kind) === "Field" ||
            (state === null || state === void 0 ? void 0 : state.kind) === "AliasedField") {
            const parentType = typeInfo.parentType;
            const parentFields = graphql_3.isInterfaceType(parentType) || graphql_1.isObjectType(parentType)
                ? parentType.getFields()
                : {};
            if (graphql_1.isAbstractType(parentType)) {
                parentFields[graphql_1.TypeNameMetaFieldDef.name] = graphql_1.TypeNameMetaFieldDef;
            }
            if (parentType === project.schema.getQueryType()) {
                parentFields[graphql_1.SchemaMetaFieldDef.name] = graphql_1.SchemaMetaFieldDef;
                parentFields[graphql_1.TypeMetaFieldDef.name] = graphql_1.TypeMetaFieldDef;
            }
            return suggestions.map((suggest) => {
                var _a, _b;
                const suggestedField = parentFields[suggest.label];
                if (!suggestedField) {
                    return suggest;
                }
                else {
                    const requiredArgs = suggestedField.args.filter((a) => graphql_1.isNonNullType(a.type));
                    const paramsSection = requiredArgs.length > 0
                        ? `(${requiredArgs
                            .map((a, i) => `${a.name}: $${i + 1}`)
                            .join(", ")})`
                        : ``;
                    const isClientType = parentType &&
                        "clientSchema" in parentType &&
                        ((_b = (_a = parentType.clientSchema) === null || _a === void 0 ? void 0 : _a.localFields) === null || _b === void 0 ? void 0 : _b.includes(suggestedField.name));
                    const directives = isClientType ? " @client" : "";
                    const snippet = hasFields(suggestedField.type)
                        ? `${suggest.label}${paramsSection}${directives} {\n\t$0\n}`
                        : `${suggest.label}${paramsSection}${directives}`;
                    return Object.assign(Object.assign({}, suggest), { insertText: snippet, insertTextFormat: vscode_languageserver_1.InsertTextFormat.Snippet });
                }
            });
        }
        if ((state === null || state === void 0 ? void 0 : state.kind) === "Directive") {
            return suggestions.map((suggest) => {
                const directive = project.schema.getDirective(suggest.label);
                if (!directive) {
                    return suggest;
                }
                const requiredArgs = directive.args.filter(graphql_1.isNonNullType);
                const paramsSection = requiredArgs.length > 0
                    ? `(${requiredArgs
                        .map((a, i) => `${a.name}: $${i + 1}`)
                        .join(", ")})`
                    : ``;
                const snippet = `${suggest.label}${paramsSection}`;
                const argsString = directive.args.length > 0
                    ? `(${directive.args
                        .map((a) => `${a.name}: ${a.type}`)
                        .join(", ")})`
                    : "";
                const content = [
                    [`\`\`\`graphql`, `@${suggest.label}${argsString}`, `\`\`\``].join("\n"),
                ];
                if (suggest.documentation) {
                    if (typeof suggest.documentation === "string") {
                        content.push(suggest.documentation);
                    }
                    else {
                        content.push(suggest.documentation.value);
                    }
                }
                const doc = {
                    kind: vscode_languageserver_1.MarkupKind.Markdown,
                    value: content.join("\n\n"),
                };
                return Object.assign(Object.assign({}, suggest), { documentation: doc, insertText: snippet, insertTextFormat: vscode_languageserver_1.InsertTextFormat.Snippet });
            });
        }
        return suggestions;
    }
    async provideHover(uri, position, _token) {
        const project = this.workspace.projectForFile(uri);
        if (!(project && project instanceof client_1.GraphQLClientProject))
            return null;
        const document = project.documentAt(uri, position);
        if (!(document && document.ast))
            return null;
        if (!project.schema)
            return null;
        const positionInDocument = source_1.positionFromPositionInContainingDocument(document.source, position);
        const nodeAndTypeInfo = source_1.getASTNodeAndTypeInfoAtPosition(document.source, positionInDocument, document.ast, project.schema);
        if (nodeAndTypeInfo) {
            const [node, typeInfo] = nodeAndTypeInfo;
            switch (node.kind) {
                case graphql_1.Kind.FRAGMENT_SPREAD: {
                    const fragmentName = node.name.value;
                    const fragment = project.fragments[fragmentName];
                    if (fragment) {
                        return {
                            contents: {
                                language: "graphql",
                                value: `fragment ${fragmentName} on ${fragment.typeCondition.name.value}`,
                            },
                        };
                    }
                    break;
                }
                case graphql_1.Kind.FIELD: {
                    const parentType = typeInfo.getParentType();
                    const fieldDef = typeInfo.getFieldDef();
                    if (parentType && fieldDef) {
                        const argsString = fieldDef.args.length > 0
                            ? `(${fieldDef.args
                                .map((a) => `${a.name}: ${a.type}`)
                                .join(", ")})`
                            : "";
                        const isClientType = parentType.clientSchema &&
                            parentType.clientSchema.localFields &&
                            parentType.clientSchema.localFields.includes(fieldDef.name);
                        const isResolvedLocally = node.directives &&
                            node.directives.some((directive) => directive.name.value === "client");
                        const content = [
                            [
                                `\`\`\`graphql`,
                                `${parentType}.${fieldDef.name}${argsString}: ${fieldDef.type}`,
                                `\`\`\``,
                            ].join("\n"),
                        ];
                        const info = [];
                        if (isClientType) {
                            info.push("`Client-Only Field`");
                        }
                        if (isResolvedLocally) {
                            info.push("`Resolved locally`");
                        }
                        if (info.length !== 0) {
                            content.push(info.join(" "));
                        }
                        if (fieldDef.description) {
                            content.push(fieldDef.description);
                        }
                        return {
                            contents: content.join("\n\n---\n\n"),
                            range: source_1.rangeForASTNode(graphql_2.highlightNodeForNode(node)),
                        };
                    }
                    break;
                }
                case graphql_1.Kind.NAMED_TYPE: {
                    const type = project.schema.getType(node.name.value);
                    if (!type)
                        break;
                    const content = [[`\`\`\`graphql`, `${type}`, `\`\`\``].join("\n")];
                    if (type.description) {
                        content.push(type.description);
                    }
                    return {
                        contents: content.join("\n\n---\n\n"),
                        range: source_1.rangeForASTNode(graphql_2.highlightNodeForNode(node)),
                    };
                }
                case graphql_1.Kind.ARGUMENT: {
                    const argumentNode = typeInfo.getArgument();
                    const content = [
                        [
                            `\`\`\`graphql`,
                            `${argumentNode.name}: ${argumentNode.type}`,
                            `\`\`\``,
                        ].join("\n"),
                    ];
                    if (argumentNode.description) {
                        content.push(argumentNode.description);
                    }
                    return {
                        contents: content.join("\n\n---\n\n"),
                        range: source_1.rangeForASTNode(graphql_2.highlightNodeForNode(node)),
                    };
                }
                case graphql_1.Kind.DIRECTIVE: {
                    const directiveNode = typeInfo.getDirective();
                    if (!directiveNode)
                        break;
                    const argsString = directiveNode.args.length > 0
                        ? `(${directiveNode.args
                            .map((a) => `${a.name}: ${a.type}`)
                            .join(", ")})`
                        : "";
                    const content = [
                        [
                            `\`\`\`graphql`,
                            `@${directiveNode.name}${argsString}`,
                            `\`\`\``,
                        ].join("\n"),
                    ];
                    if (directiveNode.description) {
                        content.push(directiveNode.description);
                    }
                    return {
                        contents: content.join("\n\n---\n\n"),
                        range: source_1.rangeForASTNode(graphql_2.highlightNodeForNode(node)),
                    };
                }
            }
        }
        return null;
    }
    async provideDefinition(uri, position, _token) {
        const project = this.workspace.projectForFile(uri);
        if (!(project && project instanceof client_1.GraphQLClientProject))
            return null;
        const document = project.documentAt(uri, position);
        if (!(document && document.ast))
            return null;
        if (!project.schema)
            return null;
        const positionInDocument = source_1.positionFromPositionInContainingDocument(document.source, position);
        const nodeAndTypeInfo = source_1.getASTNodeAndTypeInfoAtPosition(document.source, positionInDocument, document.ast, project.schema);
        if (nodeAndTypeInfo) {
            const [node, typeInfo] = nodeAndTypeInfo;
            switch (node.kind) {
                case graphql_1.Kind.FRAGMENT_SPREAD: {
                    const fragmentName = node.name.value;
                    const fragment = project.fragments[fragmentName];
                    if (fragment && fragment.loc) {
                        return locationForASTNode(fragment);
                    }
                    break;
                }
                case graphql_1.Kind.FIELD: {
                    const fieldDef = typeInfo.getFieldDef();
                    if (!(fieldDef && fieldDef.astNode && fieldDef.astNode.loc))
                        break;
                    return locationForASTNode(fieldDef.astNode);
                }
                case graphql_1.Kind.NAMED_TYPE: {
                    const type = graphql_1.typeFromAST(project.schema, node);
                    if (!(type && type.astNode && type.astNode.loc))
                        break;
                    return locationForASTNode(type.astNode);
                }
                case graphql_1.Kind.DIRECTIVE: {
                    const directive = project.schema.getDirective(node.name.value);
                    if (!(directive && directive.astNode && directive.astNode.loc))
                        break;
                    return locationForASTNode(directive.astNode);
                }
            }
        }
        return null;
    }
    async provideReferences(uri, position, _context, _token) {
        const project = this.workspace.projectForFile(uri);
        if (!project)
            return null;
        const document = project.documentAt(uri, position);
        if (!(document && document.ast))
            return null;
        if (!project.schema)
            return null;
        const positionInDocument = source_1.positionFromPositionInContainingDocument(document.source, position);
        const nodeAndTypeInfo = source_1.getASTNodeAndTypeInfoAtPosition(document.source, positionInDocument, document.ast, project.schema);
        if (nodeAndTypeInfo) {
            const [node, typeInfo] = nodeAndTypeInfo;
            switch (node.kind) {
                case graphql_1.Kind.FRAGMENT_DEFINITION: {
                    if (!client_1.isClientProject(project))
                        return null;
                    const fragmentName = node.name.value;
                    return project
                        .fragmentSpreadsForFragment(fragmentName)
                        .map((fragmentSpread) => locationForASTNode(fragmentSpread))
                        .filter(tools_1.isNotNullOrUndefined);
                }
                case graphql_1.Kind.FIELD_DEFINITION: {
                    if (!client_1.isClientProject(project))
                        return null;
                    const offset = source_1.positionToOffset(document.source, positionInDocument);
                    let parent = null;
                    graphql_1.visit(document.ast, {
                        enter(node) {
                            if (node.loc &&
                                node.loc.start <= offset &&
                                offset <= node.loc.end &&
                                (node.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                                    node.kind === graphql_1.Kind.OBJECT_TYPE_EXTENSION ||
                                    node.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION ||
                                    node.kind === graphql_1.Kind.INTERFACE_TYPE_EXTENSION ||
                                    node.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION ||
                                    node.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_EXTENSION ||
                                    node.kind === graphql_1.Kind.ENUM_TYPE_DEFINITION ||
                                    node.kind === graphql_1.Kind.ENUM_TYPE_EXTENSION)) {
                                parent = node;
                            }
                            return;
                        },
                    });
                    return project
                        .getOperationFieldsFromFieldDefinition(node.name.value, parent)
                        .map((fieldNode) => locationForASTNode(fieldNode))
                        .filter(tools_1.isNotNullOrUndefined);
                }
            }
        }
        return null;
    }
    async provideDocumentSymbol(uri, _token) {
        const project = this.workspace.projectForFile(uri);
        if (!project)
            return [];
        const definitions = project.definitionsAt(uri);
        const symbols = [];
        for (const definition of definitions) {
            if (graphql_1.isExecutableDefinitionNode(definition)) {
                if (!definition.name)
                    continue;
                const location = locationForASTNode(definition);
                if (!location)
                    continue;
                symbols.push({
                    name: definition.name.value,
                    kind: vscode_languageserver_1.SymbolKind.Function,
                    range: source_1.rangeForASTNode(definition),
                    selectionRange: source_1.rangeForASTNode(graphql_2.highlightNodeForNode(definition)),
                });
            }
            else if (graphql_1.isTypeSystemDefinitionNode(definition) ||
                graphql_1.isTypeSystemExtensionNode(definition)) {
                if (definition.kind === graphql_1.Kind.SCHEMA_DEFINITION ||
                    definition.kind === graphql_1.Kind.SCHEMA_EXTENSION) {
                    continue;
                }
                symbols.push({
                    name: definition.name.value,
                    kind: vscode_languageserver_1.SymbolKind.Class,
                    range: source_1.rangeForASTNode(definition),
                    selectionRange: source_1.rangeForASTNode(graphql_2.highlightNodeForNode(definition)),
                    children: definition.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                        definition.kind === graphql_1.Kind.OBJECT_TYPE_EXTENSION
                        ? (definition.fields || []).map(symbolForFieldDefinition)
                        : undefined,
                });
            }
        }
        return symbols;
    }
    async provideWorkspaceSymbol(query, _token) {
        const symbols = [];
        for (const project of this.workspace.projects) {
            for (const definition of project.definitions) {
                if (graphql_1.isExecutableDefinitionNode(definition)) {
                    if (!definition.name)
                        continue;
                    const location = locationForASTNode(definition);
                    if (!location)
                        continue;
                    symbols.push({
                        name: definition.name.value,
                        kind: vscode_languageserver_1.SymbolKind.Function,
                        location,
                    });
                }
            }
        }
        return symbols;
    }
    async provideCodeLenses(uri, _token) {
        const project = this.workspace.projectForFile(uri);
        if (!(project && project instanceof client_1.GraphQLClientProject))
            return [];
        await project.whenReady;
        const documents = project.documentsAt(uri);
        if (!documents)
            return [];
        let codeLenses = [];
        for (const document of documents) {
            if (!document.ast)
                continue;
            for (const definition of document.ast.definitions) {
                if (definition.kind === graphql_1.Kind.OPERATION_DEFINITION) {
                }
                else if (definition.kind === graphql_1.Kind.FRAGMENT_DEFINITION) {
                }
            }
        }
        return codeLenses;
    }
    async provideCodeAction(uri, range, _token) {
        function isPositionLessThanOrEqual(a, b) {
            return a.line !== b.line ? a.line < b.line : a.character <= b.character;
        }
        const project = this.workspace.projectForFile(uri);
        if (!(project &&
            project instanceof client_1.GraphQLClientProject &&
            project.diagnosticSet))
            return [];
        await project.whenReady;
        const documents = project.documentsAt(uri);
        if (!documents)
            return [];
        const errors = new Set();
        for (const [diagnosticUri, diagnostics,] of project.diagnosticSet.entries()) {
            if (diagnosticUri !== uri)
                continue;
            for (const diagnostic of diagnostics) {
                if (diagnostics_1.GraphQLDiagnostic.is(diagnostic) &&
                    isPositionLessThanOrEqual(range.start, diagnostic.range.end) &&
                    isPositionLessThanOrEqual(diagnostic.range.start, range.end)) {
                    errors.add(diagnostic.error);
                }
            }
        }
        const result = [];
        for (const error of errors) {
            const { extensions } = error;
            if (!extensions || !extensions.codeAction)
                continue;
            const { message, edits } = extensions.codeAction;
            const codeAction = vscode_languageserver_1.CodeAction.create(message, { changes: { [uri]: edits } }, vscode_languageserver_1.CodeActionKind.QuickFix);
            result.push(codeAction);
        }
        return result;
    }
}
exports.GraphQLLanguageProvider = GraphQLLanguageProvider;
//# sourceMappingURL=languageProvider.js.map