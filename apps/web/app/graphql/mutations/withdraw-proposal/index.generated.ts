import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type WithdrawStoreProposalMutationVariables = Types.Exact<{
  proposalId: Types.Scalars['UUID']['input'];
}>;


export type WithdrawStoreProposalMutation = { __typename?: 'Mutation', withdrawStoreProposal: { __typename?: 'StoreProposal', proposalId: any, status: Types.ProposalStatus } };


export const WithdrawStoreProposalDocument = `
    mutation WithdrawStoreProposal($proposalId: UUID!) {
  withdrawStoreProposal(proposalId: $proposalId) {
    proposalId
    status
  }
}
    `;

const injectedRtkApi = gualcalGraphqlApiSlice.injectEndpoints({
  endpoints: (build) => ({
    WithdrawStoreProposal: build.mutation<WithdrawStoreProposalMutation, WithdrawStoreProposalMutationVariables>({
      query: (variables) => ({ document: WithdrawStoreProposalDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useWithdrawStoreProposalMutation } = injectedRtkApi;

