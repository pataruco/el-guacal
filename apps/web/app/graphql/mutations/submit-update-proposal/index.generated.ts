import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type SubmitUpdateStoreProposalMutationVariables = Types.Exact<{
  input: Types.SubmitUpdateStoreProposalInput;
}>;


export type SubmitUpdateStoreProposalMutation = { __typename?: 'Mutation', submitUpdateStoreProposal: { __typename?: 'StoreProposal', proposalId: any, kind: Types.ProposalKind, status: Types.ProposalStatus, createdAt: any } };


export const SubmitUpdateStoreProposalDocument = `
    mutation SubmitUpdateStoreProposal($input: SubmitUpdateStoreProposalInput!) {
  submitUpdateStoreProposal(input: $input) {
    proposalId
    kind
    status
    createdAt
  }
}
    `;

const injectedRtkApi = gualcalGraphqlApiSlice.injectEndpoints({
  endpoints: (build) => ({
    SubmitUpdateStoreProposal: build.mutation<SubmitUpdateStoreProposalMutation, SubmitUpdateStoreProposalMutationVariables>({
      query: (variables) => ({ document: SubmitUpdateStoreProposalDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useSubmitUpdateStoreProposalMutation } = injectedRtkApi;

