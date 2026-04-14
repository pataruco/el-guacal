import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type SubmitDeleteStoreProposalMutationVariables = Types.Exact<{
  input: Types.SubmitDeleteStoreProposalInput;
}>;


export type SubmitDeleteStoreProposalMutation = { __typename?: 'Mutation', submitDeleteStoreProposal: { __typename?: 'StoreProposal', proposalId: any, kind: Types.ProposalKind, status: Types.ProposalStatus, createdAt: any } };


export const SubmitDeleteStoreProposalDocument = `
    mutation SubmitDeleteStoreProposal($input: SubmitDeleteStoreProposalInput!) {
  submitDeleteStoreProposal(input: $input) {
    proposalId
    kind
    status
    createdAt
  }
}
    `;

const injectedRtkApi = gualcalGraphqlApiSlice.injectEndpoints({
  endpoints: (build) => ({
    SubmitDeleteStoreProposal: build.mutation<SubmitDeleteStoreProposalMutation, SubmitDeleteStoreProposalMutationVariables>({
      query: (variables) => ({ document: SubmitDeleteStoreProposalDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useSubmitDeleteStoreProposalMutation } = injectedRtkApi;

