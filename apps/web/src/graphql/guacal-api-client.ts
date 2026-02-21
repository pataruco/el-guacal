import { GraphQLClient } from 'graphql-request';

export const GUACAL_GRAPHQL_API =
  import.meta.env.VITE_GUACAL_GRAPHQL_API ??
  `${window.location.origin}/graphql`;

export const gualcalGraphqlApiClient = new GraphQLClient(GUACAL_GRAPHQL_API);
