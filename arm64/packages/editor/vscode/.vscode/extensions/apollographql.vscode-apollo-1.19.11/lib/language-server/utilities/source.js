"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getASTNodeAndTypeInfoAtPosition = exports.positionToOffset = exports.positionFromSourceLocation = exports.rangeForASTNode = exports.rangeInContainingDocument = exports.positionInContainingDocument = exports.positionFromPositionInContainingDocument = exports.visitWithTypeInfo = void 0;
const graphql_1 = require("graphql");
const location_1 = require("graphql/language/location");
const vscode_languageserver_1 = require("vscode-languageserver");
const graphql_2 = require("./graphql");
function visitWithTypeInfo(typeInfo, visitor) {
    return {
        enter(node) {
            typeInfo.enter(node);
            const fn = graphql_1.getVisitFn(visitor, node.kind, false);
            if (fn) {
                const result = fn.apply(visitor, arguments);
                if (result !== undefined) {
                    typeInfo.leave(node);
                    if (graphql_2.isNode(result)) {
                        typeInfo.enter(result);
                    }
                }
                return result;
            }
        },
        leave(node) {
            const fn = graphql_1.getVisitFn(visitor, node.kind, true);
            let result;
            if (fn) {
                result = fn.apply(visitor, arguments);
            }
            if (result !== graphql_1.BREAK) {
                typeInfo.leave(node);
            }
            return result;
        },
    };
}
exports.visitWithTypeInfo = visitWithTypeInfo;
function positionFromPositionInContainingDocument(source, position) {
    if (!source.locationOffset)
        return position;
    return vscode_languageserver_1.Position.create(position.line - (source.locationOffset.line - 1), position.character);
}
exports.positionFromPositionInContainingDocument = positionFromPositionInContainingDocument;
function positionInContainingDocument(source, position) {
    if (!source.locationOffset)
        return position;
    return vscode_languageserver_1.Position.create(source.locationOffset.line - 1 + position.line, position.character);
}
exports.positionInContainingDocument = positionInContainingDocument;
function rangeInContainingDocument(source, range) {
    if (!source.locationOffset)
        return range;
    return vscode_languageserver_1.Range.create(positionInContainingDocument(source, range.start), positionInContainingDocument(source, range.end));
}
exports.rangeInContainingDocument = rangeInContainingDocument;
function rangeForASTNode(node) {
    const location = node.loc;
    const source = location.source;
    return vscode_languageserver_1.Range.create(positionFromSourceLocation(source, location_1.getLocation(source, location.start)), positionFromSourceLocation(source, location_1.getLocation(source, location.end)));
}
exports.rangeForASTNode = rangeForASTNode;
function positionFromSourceLocation(source, location) {
    return vscode_languageserver_1.Position.create((source.locationOffset ? source.locationOffset.line - 1 : 0) +
        location.line -
        1, (source.locationOffset && location.line === 1
        ? source.locationOffset.column - 1
        : 0) +
        location.column -
        1);
}
exports.positionFromSourceLocation = positionFromSourceLocation;
function positionToOffset(source, position) {
    const lineRegexp = /\r\n|[\n\r]/g;
    const lineEndingLength = /\r\n/g.test(source.body) ? 2 : 1;
    const linesUntilPosition = source.body
        .split(lineRegexp)
        .slice(0, position.line);
    return (position.character +
        linesUntilPosition
            .map((line) => line.length + lineEndingLength)
            .reduce((a, b) => a + b, 0));
}
exports.positionToOffset = positionToOffset;
function getASTNodeAndTypeInfoAtPosition(source, position, root, schema) {
    const offset = positionToOffset(source, position);
    let nodeContainingPosition = null;
    const typeInfo = new graphql_1.TypeInfo(schema);
    graphql_1.visit(root, visitWithTypeInfo(typeInfo, {
        enter(node) {
            if (node.kind !== graphql_1.Kind.NAME &&
                node.loc &&
                node.loc.start <= offset &&
                offset <= node.loc.end) {
                nodeContainingPosition = node;
            }
            else {
                return false;
            }
            return;
        },
        leave(node) {
            if (node.loc && node.loc.start <= offset && offset <= node.loc.end) {
                return graphql_1.BREAK;
            }
            return;
        },
    }));
    if (nodeContainingPosition) {
        return [nodeContainingPosition, typeInfo];
    }
    else {
        return null;
    }
}
exports.getASTNodeAndTypeInfoAtPosition = getASTNodeAndTypeInfoAtPosition;
//# sourceMappingURL=source.js.map