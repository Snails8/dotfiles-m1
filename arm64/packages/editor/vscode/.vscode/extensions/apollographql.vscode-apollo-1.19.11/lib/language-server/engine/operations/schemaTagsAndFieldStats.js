"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMA_TAGS_AND_FIELD_STATS = void 0;
const graphql_tag_1 = __importDefault(require("graphql-tag"));
exports.SCHEMA_TAGS_AND_FIELD_STATS = graphql_tag_1.default `
  query SchemaTagsAndFieldStats($id: ID!) {
    service(id: $id) {
      schemaTags {
        tag
      }
      stats(from: "-86400", to: "-0") {
        fieldLatencies {
          groupBy {
            parentType
            fieldName
          }
          metrics {
            fieldHistogram {
              durationMs(percentile: 0.95)
            }
          }
        }
      }
    }
  }
`;
//# sourceMappingURL=schemaTagsAndFieldStats.js.map