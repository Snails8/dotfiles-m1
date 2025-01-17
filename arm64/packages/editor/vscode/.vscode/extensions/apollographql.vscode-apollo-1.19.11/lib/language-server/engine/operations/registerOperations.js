"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGISTER_OPERATIONS = void 0;
const graphql_tag_1 = __importDefault(require("graphql-tag"));
exports.REGISTER_OPERATIONS = graphql_tag_1.default `
  mutation RegisterOperations(
    $id: ID!
    $clientIdentity: RegisteredClientIdentityInput!
    $operations: [RegisteredOperationInput!]!
    $manifestVersion: Int!
    $graphVariant: String
  ) {
    service(id: $id) {
      registerOperationsWithResponse(
        clientIdentity: $clientIdentity
        operations: $operations
        manifestVersion: $manifestVersion
        graphVariant: $graphVariant
      ) {
        invalidOperations {
          errors {
            message
          }
          signature
        }
        newOperations {
          signature
        }
        registrationSuccess
      }
    }
  }
`;
//# sourceMappingURL=registerOperations.js.map