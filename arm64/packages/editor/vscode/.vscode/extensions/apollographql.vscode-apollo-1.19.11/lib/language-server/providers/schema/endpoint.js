"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointSchemaProvider = void 0;
const apollo_link_1 = require("apollo-link");
const apollo_link_http_1 = require("apollo-link-http");
const graphql_1 = require("graphql");
const https_1 = require("https");
const env_1 = require("../../../env");
const config_1 = require("../../config");
const utilities_1 = require("../../utilities");
const util_1 = require("util");
class EndpointSchemaProvider {
    constructor(config) {
        this.config = config;
    }
    async resolveSchema() {
        if (this.schema)
            return this.schema;
        const { skipSSLValidation, url, headers } = this.config;
        const options = {
            uri: url,
            fetch: env_1.fetch,
        };
        if (url.startsWith("https:") && skipSSLValidation) {
            options.fetchOptions = {
                agent: new https_1.Agent({ rejectUnauthorized: false }),
            };
        }
        const { data, errors } = (await apollo_link_1.toPromise(apollo_link_1.execute(apollo_link_http_1.createHttpLink(options), {
            query: graphql_1.parse(graphql_1.getIntrospectionQuery()),
            context: { headers },
        })).catch((e) => {
            if (util_1.isString(e.message) && e.message.includes("token <")) {
                throw new Error("Apollo tried to introspect a running GraphQL service at " +
                    url +
                    "\nIt expected a JSON schema introspection result, but got an HTML response instead." +
                    "\nYou may need to add headers to your request or adjust your endpoint url.\n" +
                    "-----------------------------\n" +
                    "For more information, please refer to: https://go.apollo.dev/t/config \n\n" +
                    "The following error occurred:\n-----------------------------\n" +
                    e.message);
            }
            if (url === config_1.DefaultServiceConfig.endpoint.url &&
                util_1.isString(e.message) &&
                e.message.includes("ECONNREFUSED")) {
                throw new Error("Failed to connect to a running GraphQL endpoint at " +
                    url +
                    "\nThis may be because you didn't start your service.\n" +
                    "By default, when an endpoint, Apollo API key, or localSchemaFile isn't provided, Apollo tries to fetch a schema from " +
                    config_1.DefaultServiceConfig.endpoint.url +
                    "\n-----------------------------\n" +
                    "\nFor more information, please refer to: https://go.apollo.dev/t/config \n\n" +
                    "The following error occurred: \n" +
                    "-----------------------------\n" +
                    e.message);
            }
            if (util_1.isString(e.message) && e.message.includes("ECONNREFUSED")) {
                throw new Error("Failed to connect to a running GraphQL endpoint at " +
                    url +
                    "\nThis may be because you didn't start your service or the endpoint URL is incorrect.");
            }
            throw new Error(e);
        }));
        if (errors && errors.length) {
            throw new Error(errors.map(({ message }) => message).join("\n"));
        }
        if (!data) {
            throw new Error("No data received from server introspection.");
        }
        this.schema = graphql_1.buildClientSchema(data);
        return this.schema;
    }
    onSchemaChange(_handler) {
        throw new Error("Polling of endpoint not implemented yet");
        return () => { };
    }
    async resolveFederatedServiceSDL() {
        if (this.federatedServiceSDL)
            return this.federatedServiceSDL;
        const { skipSSLValidation, url, headers } = this.config;
        const options = {
            uri: url,
            fetch: env_1.fetch,
        };
        if (url.startsWith("https:") && skipSSLValidation) {
            options.fetchOptions = {
                agent: new https_1.Agent({ rejectUnauthorized: false }),
            };
        }
        const getFederationInfoQuery = `
      query getFederationInfo {
        _service {
          sdl
        }
      }
    `;
        const { data, errors } = (await apollo_link_1.toPromise(apollo_link_1.execute(apollo_link_http_1.createHttpLink(options), {
            query: graphql_1.parse(getFederationInfoQuery),
            context: { headers },
        })));
        if (errors && errors.length) {
            return utilities_1.Debug.error(errors.map(({ message }) => message).join("\n"));
        }
        if (!data || !data._service) {
            return utilities_1.Debug.error("No data received from server when querying for _service.");
        }
        this.federatedServiceSDL = data._service.sdl;
        return data._service.sdl;
    }
}
exports.EndpointSchemaProvider = EndpointSchemaProvider;
//# sourceMappingURL=endpoint.js.map