import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type UpdateStoreMutationVariables = Types.Exact<{
  input: Types.UpdateStoreInput;
}>;


export type UpdateStoreMutation = { __typename?: 'Mutation', updateStore: { __typename?: 'Store', storeId: any, name: string, address: string, location: { __typename?: 'Location', lat: number, lng: number } } };


export const UpdateStoreDocument = `
    mutation UpdateStore($input: UpdateStoreInput!) {
  updateStore(input: $input) {
    storeId
    name
    address
    location {
      lat
      lng
    }
  }
}
    `;

const injectedRtkApi = gualcalGraphqlApiSlice.injectEndpoints({
  endpoints: (build) => ({
    UpdateStore: build.mutation<UpdateStoreMutation, UpdateStoreMutationVariables>({
      query: (variables) => ({ document: UpdateStoreDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useUpdateStoreMutation } = injectedRtkApi;
