import { GraphQLClient } from 'graphql-request';

export const GUACAL_GRAPHQL_API =
  import.meta.env.VITE_GUACAL_GRAPHQL_API ?? 'http://0.0.0.0:8080/graphql';

export const gualcalGraphqlApiClient = new GraphQLClient(GUACAL_GRAPHQL_API);
