import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type GetStoresNearQueryVariables = Types.Exact<{
  location: Types.LocationInput;
  radius: Types.Radius;
  productIds?: Types.InputMaybe<Array<Types.Scalars['UUID']['input']> | Types.Scalars['UUID']['input']>;
}>;


export type GetStoresNearQuery = { __typename?: 'Query', storesNear: Array<{ __typename?: 'Store', name: string, storeId: any, location: { __typename?: 'Location', lat: number, lng: number }, products: Array<{ __typename?: 'Product', name: string }> }> };


export const GetStoresNearDocument = `
    query GetStoresNear($location: LocationInput!, $radius: Radius!, $productIds: [UUID!]) {
  storesNear(location: $location, radius: $radius, productIds: $productIds) {
    name
    storeId
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

const injectedRtkApi = gualcalGraphqlApiSlice.injectEndpoints({
  endpoints: (build) => ({
    GetStoresNear: build.query<GetStoresNearQuery, GetStoresNearQueryVariables>({
      query: (variables) => ({ document: GetStoresNearDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useGetStoresNearQuery, useLazyGetStoresNearQuery } = injectedRtkApi;

