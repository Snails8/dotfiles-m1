"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoMissingClientDirectives = exports.NoTypenameAlias = exports.NoAnonymousQueries = exports.validateQueryDocument = exports.getValidationErrors = exports.defaultValidationRules = void 0;
const graphql_1 = require("graphql");
const vscode_languageserver_1 = require("vscode-languageserver");
const logger_1 = require("./logger");
const source_1 = require("../utilities/source");
const execute_1 = require("graphql/execution/execute");
const graphql_2 = require("../utilities/graphql");
const utilities_1 = require("../utilities");
const specifiedRulesToBeRemoved = [graphql_1.NoUnusedFragmentsRule];
exports.defaultValidationRules = [
    NoAnonymousQueries,
    NoTypenameAlias,
    NoMissingClientDirectives,
    ...graphql_1.specifiedRules.filter((rule) => !specifiedRulesToBeRemoved.includes(rule)),
];
function getValidationErrors(schema, document, fragments, rules = exports.defaultValidationRules) {
    const typeInfo = new graphql_1.TypeInfo(schema);
    const errors = [];
    const onError = (err) => errors.push(err);
    const context = new graphql_1.ValidationContext(schema, document, typeInfo, onError);
    if (fragments) {
        context._fragments = fragments;
    }
    const visitors = rules.map((rule) => rule(context));
    graphql_1.visit(document, graphql_1.visitWithTypeInfo(typeInfo, graphql_1.visitInParallel(visitors)));
    if (typeof context.getErrors === "function")
        return context.getErrors();
    return errors;
}
exports.getValidationErrors = getValidationErrors;
function validateQueryDocument(schema, document) {
    try {
        const validationErrors = getValidationErrors(schema, document);
        if (validationErrors && validationErrors.length > 0) {
            for (const error of validationErrors) {
                logger_1.logError(error);
            }
            return utilities_1.Debug.error("Validation of GraphQL query document failed");
        }
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}
exports.validateQueryDocument = validateQueryDocument;
function NoAnonymousQueries(context) {
    return {
        OperationDefinition(node) {
            if (!node.name) {
                context.reportError(new graphql_1.GraphQLError("Apollo does not support anonymous operations", [
                    node,
                ]));
            }
            return false;
        },
    };
}
exports.NoAnonymousQueries = NoAnonymousQueries;
function NoTypenameAlias(context) {
    return {
        Field(node) {
            const aliasName = node.alias && node.alias.value;
            if (aliasName == "__typename") {
                context.reportError(new graphql_1.GraphQLError("Apollo needs to be able to insert __typename when needed, please do not use it as an alias", [node]));
            }
        },
    };
}
exports.NoTypenameAlias = NoTypenameAlias;
function hasClientSchema(schema) {
    const query = schema.getQueryType();
    const mutation = schema.getMutationType();
    const subscription = schema.getSubscriptionType();
    return Boolean((query && query.clientSchema) ||
        (mutation && mutation.clientSchema) ||
        (subscription && subscription.clientSchema));
}
function NoMissingClientDirectives(context) {
    const root = context.getDocument();
    const schema = context.getSchema();
    if (!hasClientSchema(schema))
        return {};
    const executionContext = execute_1.buildExecutionContext(schema, root, Object.create(null), Object.create(null), undefined, undefined, undefined);
    function visitor(node) {
        const parentType = node.kind === graphql_1.Kind.FRAGMENT_DEFINITION
            ? schema.getType(node.typeCondition.name.value)
            : context.getParentType();
        const fieldDef = context.getFieldDef();
        if (!parentType)
            return;
        const clientFields = parentType &&
            graphql_1.isObjectType(parentType) &&
            parentType.clientSchema &&
            parentType.clientSchema.localFields;
        let clientDirectivePresent = graphql_2.hasClientDirective(node);
        let message = "@client directive is missing on ";
        let selectsClientFieldSet = false;
        switch (node.kind) {
            case graphql_1.Kind.FIELD:
                selectsClientFieldSet = Boolean(clientFields && clientFields.includes(fieldDef.name));
                message += `local field "${node.name.value}"`;
                break;
            case graphql_1.Kind.INLINE_FRAGMENT:
            case graphql_1.Kind.FRAGMENT_DEFINITION:
                if (Array.isArray(executionContext))
                    break;
                const fields = graphql_2.simpleCollectFields(executionContext, node.selectionSet, Object.create(null), Object.create(null));
                const fieldNames = Object.entries(fields).map(([name]) => name);
                selectsClientFieldSet = fieldNames.every((field) => clientFields && clientFields.includes(field));
                message += `fragment ${"name" in node ? `"${node.name.value}" ` : ""}around local fields "${fieldNames.join(",")}"`;
                break;
        }
        if (selectsClientFieldSet && !clientDirectivePresent) {
            let extensions = null;
            const name = "name" in node && node.name;
            if (name && name.loc) {
                let { source, end: locToInsertDirective } = name.loc;
                if ("arguments" in node &&
                    node.arguments &&
                    node.arguments.length !== 0) {
                    const endOfArgs = source.body.indexOf(")", locToInsertDirective);
                    locToInsertDirective = endOfArgs + 1;
                }
                const codeAction = {
                    message: `Add @client directive to "${name.value}"`,
                    edits: [
                        vscode_languageserver_1.TextEdit.insert(source_1.positionFromSourceLocation(source, graphql_1.getLocation(source, locToInsertDirective)), " @client"),
                    ],
                };
                extensions = { codeAction };
            }
            context.reportError(new graphql_1.GraphQLError(message, [node], null, null, null, null, extensions));
        }
        if (selectsClientFieldSet) {
            return false;
        }
        return;
    }
    return {
        InlineFragment: visitor,
        FragmentDefinition: visitor,
        Field: visitor,
    };
}
exports.NoMissingClientDirectives = NoMissingClientDirectives;
//# sourceMappingURL=validation.js.map