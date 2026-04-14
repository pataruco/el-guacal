import { createApi } from '@reduxjs/toolkit/query/react';
import { graphqlRequestBaseQuery } from '@rtk-query/graphql-request-base-query';
import { gualcalGraphqlApiClient } from '../../../graphql/guacal-api-client';
import type { RootState } from '../../store';

export const gualcalGraphqlApiSlice = createApi({
  baseQuery: graphqlRequestBaseQuery({
    client: gualcalGraphqlApiClient,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.idToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
  reducerPath: 'gualcalGraphqlApi',
  tagTypes: ['Store', 'Proposal'],
});
