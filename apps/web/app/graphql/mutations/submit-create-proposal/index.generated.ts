import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type SubmitCreateStoreProposalMutationVariables = Types.Exact<{
  input: Types.SubmitCreateStoreProposalInput;
}>;


export type SubmitCreateStoreProposalMutation = { __typename?: 'Mutation', submitCreateStoreProposal: { __typename?: 'StoreProposal', proposalId: any, kind: Types.ProposalKind, status: Types.ProposalStatus, proposedName?: string | null, proposedAddress?: string | null, createdAt: any, proposedLocation?: { __typename?: 'Location', lat: number, lng: number } | null, possibleDuplicates: Array<{ __typename?: 'Store', storeId: any, name: string, address: string, location: { __typename?: 'Location', lat: number, lng: number } }> } };


export const SubmitCreateStoreProposalDocument = `
    mutation SubmitCreateStoreProposal($input: SubmitCreateStoreProposalInput!) {
  submitCreateStoreProposal(input: $input) {
    proposalId
    kind
    status
    proposedName
    proposedAddress
    proposedLocation {
      lat
      lng
    }
    createdAt
    possibleDuplicates {
      storeId
      name
      address
      location {
        lat
        lng
      }
    }
  }
}
    `;

const injectedRtkApi = gualcalGraphqlApiSlice.injectEndpoints({
  endpoints: (build) => ({
    SubmitCreateStoreProposal: build.mutation<SubmitCreateStoreProposalMutation, SubmitCreateStoreProposalMutationVariables>({
      query: (variables) => ({ document: SubmitCreateStoreProposalDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useSubmitCreateStoreProposalMutation } = injectedRtkApi;

