import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type AllProductsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type AllProductsQuery = { __typename?: 'Query', allProducts: Array<{ __typename?: 'Product', productId: any, name: string, brand: string }> };


export const AllProductsDocument = `
    query AllProducts {
  allProducts {
    productId
    name
    brand
  }
}
    `;

const injectedRtkApi = gualcalGraphqlApiSlice.injectEndpoints({
  endpoints: (build) => ({
    AllProducts: build.query<AllProductsQuery, AllProductsQueryVariables | void>({
      query: (variables) => ({ document: AllProductsDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useAllProductsQuery, useLazyAllProductsQuery } = injectedRtkApi;

