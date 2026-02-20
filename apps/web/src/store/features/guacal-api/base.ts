import { createApi } from '@reduxjs/toolkit/query/react';
import { graphqlRequestBaseQuery } from '@rtk-query/graphql-request-base-query';
import { gualcalGraphqlApiClient } from '../../../graphql/guacal-api-client';

export const api = createApi({
  baseQuery: graphqlRequestBaseQuery({ client: gualcalGraphqlApiClient }),
  endpoints: () => ({}),
});
