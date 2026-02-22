import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type GetStoreByIdQueryVariables = Types.Exact<{
  storeId: Types.Scalars['UUID']['input'];
}>;


export type GetStoreByIdQuery = { __typename?: 'Query', getStoreById?: { __typename?: 'Store', name: string, storeId: any, address: string, updatedAt: any, products: Array<{ __typename?: 'Product', name: string }> } | null };


export const GetStoreByIdDocument = `
    query GetStoreById($storeId: UUID!) {
  getStoreById(id: $storeId) {
    name
    storeId
    address
    updatedAt
    products {
      name
    }
  }
}
    `;

const injectedRtkApi = gualcalGraphqlApiSlice.injectEndpoints({
  endpoints: (build) => ({
    GetStoreById: build.query<GetStoreByIdQuery, GetStoreByIdQueryVariables>({
      query: (variables) => ({ document: GetStoreByIdDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useGetStoreByIdQuery, useLazyGetStoreByIdQuery } = injectedRtkApi;

