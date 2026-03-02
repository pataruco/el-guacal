import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type DeleteStoreMutationVariables = Types.Exact<{
  id: Types.Scalars['UUID']['input'];
}>;


export type DeleteStoreMutation = { __typename?: 'Mutation', deleteStore: boolean };


export const DeleteStoreDocument = `
    mutation DeleteStore($id: UUID!) {
  deleteStore(id: $id)
}
    `;

const injectedRtkApi = gualcalGraphqlApiSlice.injectEndpoints({
  endpoints: (build) => ({
    DeleteStore: build.mutation<DeleteStoreMutation, DeleteStoreMutationVariables>({
      query: (variables) => ({ document: DeleteStoreDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useDeleteStoreMutation } = injectedRtkApi;

