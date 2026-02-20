import * as Types from '../../types';

import { api } from '@/store/features/guacal-api/base';
export type GetStoresNearQueryVariables = Types.Exact<{
  location: Types.LocationInput;
  radius: Types.Radius;
}>;


export type GetStoresNearQuery = { __typename?: 'Query', storesNear: Array<{ __typename?: 'Store', name: string, location: { __typename?: 'Location', lat: number, lng: number }, products: Array<{ __typename?: 'Product', name: string }> }> };


export const GetStoresNearDocument = `
    query GetStoresNear($location: LocationInput!, $radius: Radius!) {
  storesNear(location: $location, radius: $radius) {
    name
    location {
      lat
      lng
    }
    products {
      name
    }
  }
}
    `;

const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    GetStoresNear: build.query<GetStoresNearQuery, GetStoresNearQueryVariables>({
      query: (variables) => ({ document: GetStoresNearDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useGetStoresNearQuery, useLazyGetStoresNearQuery } = injectedRtkApi;

