import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type CreateStoreMutationVariables = Types.Exact<{
  input: Types.CreateStoreInput;
}>;


export type CreateStoreMutation = { __typename?: 'Mutation', createStore: { __typename?: 'Store', storeId: any, name: string, address: string, location: { __typename?: 'Location', lat: number, lng: number } } };


export const CreateStoreDocument = `
    mutation CreateStore($input: CreateStoreInput!) {
  createStore(input: $input) {
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
    CreateStore: build.mutation<CreateStoreMutation, CreateStoreMutationVariables>({
      query: (variables) => ({ document: CreateStoreDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useCreateStoreMutation } = injectedRtkApi;
