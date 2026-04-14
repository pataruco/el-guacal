// Import generated endpoints first — this triggers injectEndpoints() calls
import '@/graphql/mutations/create-store/index.generated';
import '@/graphql/mutations/delete-store/index.generated';
import '@/graphql/mutations/submit-create-proposal/index.generated';
import '@/graphql/mutations/submit-delete-proposal/index.generated';
import '@/graphql/mutations/submit-update-proposal/index.generated';
import '@/graphql/mutations/update-store/index.generated';
import '@/graphql/mutations/withdraw-proposal/index.generated';
import '@/graphql/queries/get-store-by-id/index.generated';
import '@/graphql/queries/get-stores-near/index.generated';
import '@/graphql/queries/my-proposals/index.generated';

// Now that endpoints exist, wire up cache tags
import { gualcalGraphqlApiSlice } from './base';

gualcalGraphqlApiSlice.enhanceEndpoints({
  endpoints: {
    CreateStore: { invalidatesTags: ['Store'] },
    DeleteStore: { invalidatesTags: ['Store'] },
    GetStoreById: {
      providesTags: (
        _result: unknown,
        _error: unknown,
        { storeId }: { storeId: string },
      ) => [{ id: storeId, type: 'Store' as const }],
    },
    GetStoresNear: { providesTags: ['Store'] },
    MyStoreProposals: { providesTags: ['Proposal'] },
    SubmitCreateStoreProposal: { invalidatesTags: ['Proposal'] },
    SubmitDeleteStoreProposal: { invalidatesTags: ['Proposal'] },
    SubmitUpdateStoreProposal: { invalidatesTags: ['Proposal'] },
    UpdateStore: { invalidatesTags: ['Store'] },
    WithdrawStoreProposal: { invalidatesTags: ['Proposal'] },
  },
});
