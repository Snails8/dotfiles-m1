"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHECK_PARTIAL_SCHEMA = void 0;
const graphql_tag_1 = __importDefault(require("graphql-tag"));
exports.CHECK_PARTIAL_SCHEMA = graphql_tag_1.default `
  mutation CheckPartialSchema(
    $id: ID!
    $graphVariant: String!
    $implementingServiceName: String!
    $partialSchema: PartialSchemaInput!
    $gitContext: GitContextInput
    $historicParameters: HistoricQueryParameters
  ) {
    service(id: $id) {
      checkPartialSchema(
        graphVariant: $graphVariant
        implementingServiceName: $implementingServiceName
        partialSchema: $partialSchema
        gitContext: $gitContext
        historicParameters: $historicParameters
      ) {
        compositionValidationResult {
          compositionValidationDetails {
            schemaHash
          }
          graphCompositionID
          errors {
            message
          }
        }
        checkSchemaResult {
          diffToPrevious {
            severity
            affectedClients {
              __typename
            }
            affectedQueries {
              __typename
            }
            numberOfCheckedOperations
            changes {
              severity
              code
              description
            }
            validationConfig {
              from
              to
              queryCountThreshold
              queryCountThresholdPercentage
            }
          }
          targetUrl
        }
      }
    }
  }
`;
//# sourceMappingURL=checkPartialSchema.js.map