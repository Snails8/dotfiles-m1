"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLOAD_AND_COMPOSE_PARTIAL_SCHEMA = void 0;
const graphql_tag_1 = __importDefault(require("graphql-tag"));
exports.UPLOAD_AND_COMPOSE_PARTIAL_SCHEMA = graphql_tag_1.default `
  mutation UploadAndComposePartialSchema(
    $id: ID!
    $graphVariant: String!
    $name: String!
    $url: String!
    $revision: String!
    $activePartialSchema: PartialSchemaInput!
  ) {
    service(id: $id) {
      upsertImplementingServiceAndTriggerComposition(
        name: $name
        url: $url
        revision: $revision
        activePartialSchema: $activePartialSchema
        graphVariant: $graphVariant
      ) {
        compositionConfig {
          schemaHash
        }
        errors {
          message
        }
        didUpdateGateway: updatedGateway
        serviceWasCreated: wasCreated
      }
    }
  }
`;
//# sourceMappingURL=uploadAndComposePartialSchema.js.map