import * as Types from '../../types';

import { gualcalGraphqlApiSlice } from '@/store/features/guacal-api/base';
export type MyStoreProposalsQueryVariables = Types.Exact<{
  status?: Types.InputMaybe<Types.ProposalStatus>;
  limit?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  cursor?: Types.InputMaybe<Types.Scalars['String']['input']>;
}>;


export type MyStoreProposalsQuery = { __typename?: 'Query', myStoreProposals: { __typename?: 'StoreProposalConnection', hasNextPage: boolean, edges: Array<{ __typename?: 'StoreProposalEdge', cursor: string, node: { __typename?: 'StoreProposal', proposalId: any, kind: Types.ProposalKind, status: Types.ProposalStatus, proposedName?: string | null, proposedAddress?: string | null, reason?: string | null, createdAt: any, reviewedAt?: any | null, reviewNote?: string | null, proposedLocation?: { __typename?: 'Location', lat: number, lng: number } | null } }> } };


export const MyStoreProposalsDocument = `
    query MyStoreProposals($status: ProposalStatus, $limit: Int, $cursor: String) {
  myStoreProposals(status: $status, limit: $limit, cursor: $cursor) {
    edges {
      cursor
      node {
        proposalId
        kind
        status
        proposedName
        proposedAddress
        proposedLocation {
          lat
          lng
        }
        reason
        createdAt
        reviewedAt
        reviewNote
      }
    }
    hasNextPage
  }
}
    `;

const injectedRtkApi = gualcalGraphqlApiSlice.injectEndpoints({
  endpoints: (build) => ({
    MyStoreProposals: build.query<MyStoreProposalsQuery, MyStoreProposalsQueryVariables | void>({
      query: (variables) => ({ document: MyStoreProposalsDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useMyStoreProposalsQuery, useLazyMyStoreProposalsQuery } = injectedRtkApi;

