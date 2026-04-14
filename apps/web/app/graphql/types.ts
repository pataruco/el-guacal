export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /**
   * Implement the DateTime<Utc> scalar
   *
   * The input/output is a string in RFC3339 format.
   */
  DateTime: { input: any; output: any; }
  /**
   * A UUID is a unique 128-bit number, stored as 16 octets. UUIDs are parsed as
   * Strings within GraphQL. UUIDs are used to assign unique identifiers to
   * entities without requiring a central allocating authority.
   *
   * # References
   *
   * * [Wikipedia: Universally Unique Identifier](http://en.wikipedia.org/wiki/Universally_unique_identifier)
   * * [RFC4122: A Universally Unique Identifier (UUID) URN Namespace](http://tools.ietf.org/html/rfc4122)
   */
  UUID: { input: any; output: any; }
};

export type CreateStoreInput = {
  address: Scalars['String']['input'];
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  productIds: Array<Scalars['UUID']['input']>;
};

export type Location = {
  __typename?: 'Location';
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
};

export type LocationInput = {
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** @deprecated Use submitCreateStoreProposal. Kept for admin bulk imports. */
  createStore: Store;
  /** @deprecated Use submitDeleteStoreProposal. Kept for admin emergencies. */
  deleteStore: Scalars['Boolean']['output'];
  reviewStoreProposal: StoreProposal;
  setUserRole: User;
  submitCreateStoreProposal: StoreProposal;
  submitDeleteStoreProposal: StoreProposal;
  submitUpdateStoreProposal: StoreProposal;
  /** @deprecated Use submitUpdateStoreProposal. Kept for admin bulk imports. */
  updateStore: Store;
  withdrawStoreProposal: StoreProposal;
};


export type MutationCreateStoreArgs = {
  input: CreateStoreInput;
};


export type MutationDeleteStoreArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationReviewStoreProposalArgs = {
  input: ReviewProposalInput;
};


export type MutationSetUserRoleArgs = {
  input: SetUserRoleInput;
};


export type MutationSubmitCreateStoreProposalArgs = {
  input: SubmitCreateStoreProposalInput;
};


export type MutationSubmitDeleteStoreProposalArgs = {
  input: SubmitDeleteStoreProposalInput;
};


export type MutationSubmitUpdateStoreProposalArgs = {
  input: SubmitUpdateStoreProposalInput;
};


export type MutationUpdateStoreArgs = {
  input: UpdateStoreInput;
};


export type MutationWithdrawStoreProposalArgs = {
  proposalId: Scalars['UUID']['input'];
};

export type Product = {
  __typename?: 'Product';
  brand: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  productId: Scalars['UUID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ProposalKind =
  | 'CREATE'
  | 'DELETE'
  | 'UPDATE';

export type ProposalStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'SUPERSEDED'
  | 'WITHDRAWN';

export type Query = {
  __typename?: 'Query';
  allProducts: Array<Product>;
  getStoreById?: Maybe<Store>;
  myStoreProposals: StoreProposalConnection;
  pendingStoreProposals: StoreProposalConnection;
  storeProposal?: Maybe<StoreProposal>;
  storesNear: Array<Store>;
};


export type QueryGetStoreByIdArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryMyStoreProposalsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ProposalStatus>;
};


export type QueryPendingStoreProposalsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  kind?: InputMaybe<ProposalKind>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
};


export type QueryStoreProposalArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryStoresNearArgs = {
  location: LocationInput;
  productIds?: InputMaybe<Array<Scalars['UUID']['input']>>;
  radius: Radius;
};

export type Radius =
  | 'ZOOM_11'
  | 'ZOOM_12'
  | 'ZOOM_13'
  | 'ZOOM_14'
  | 'ZOOM_15'
  | 'ZOOM_16'
  | 'ZOOM_17'
  | 'ZOOM_18'
  | 'ZOOM_19'
  | 'ZOOM_20'
  | 'ZOOM_21'
  | 'ZOOM_22';

export type ReviewDecision =
  | 'APPROVE'
  | 'REJECT';

export type ReviewProposalInput = {
  decision: ReviewDecision;
  note?: InputMaybe<Scalars['String']['input']>;
  proposalId: Scalars['UUID']['input'];
};

export type SetUserRoleInput = {
  firebaseUid: Scalars['String']['input'];
  region?: InputMaybe<Scalars['String']['input']>;
  role: Scalars['String']['input'];
};

export type Store = {
  __typename?: 'Store';
  address: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  location: Location;
  name: Scalars['String']['output'];
  products: Array<Product>;
  storeId: Scalars['UUID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type StoreDiff = {
  __typename?: 'StoreDiff';
  after?: Maybe<Scalars['String']['output']>;
  before?: Maybe<Scalars['String']['output']>;
  field: Scalars['String']['output'];
};

export type StoreProposal = {
  __typename?: 'StoreProposal';
  clientNonce: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  diffAgainstCurrent: Array<StoreDiff>;
  kind: ProposalKind;
  possibleDuplicates: Array<Store>;
  proposalId: Scalars['UUID']['output'];
  proposedAddress?: Maybe<Scalars['String']['output']>;
  proposedLocation?: Maybe<Location>;
  proposedName?: Maybe<Scalars['String']['output']>;
  proposer?: Maybe<User>;
  reason?: Maybe<Scalars['String']['output']>;
  reviewNote?: Maybe<Scalars['String']['output']>;
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedByUser?: Maybe<User>;
  status: ProposalStatus;
  targetStoreId?: Maybe<Scalars['UUID']['output']>;
  targetVersion?: Maybe<Scalars['Int']['output']>;
};

/** Cursor-based pagination connection */
export type StoreProposalConnection = {
  __typename?: 'StoreProposalConnection';
  edges: Array<StoreProposalEdge>;
  hasNextPage: Scalars['Boolean']['output'];
};

/** Cursor-based pagination edge */
export type StoreProposalEdge = {
  __typename?: 'StoreProposalEdge';
  cursor: Scalars['String']['output'];
  node: StoreProposal;
};

export type SubmitCreateStoreProposalInput = {
  address: Scalars['String']['input'];
  clientNonce: Scalars['String']['input'];
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  notADuplicate?: InputMaybe<Scalars['Boolean']['input']>;
  productIds: Array<Scalars['UUID']['input']>;
};

export type SubmitDeleteStoreProposalInput = {
  clientNonce: Scalars['String']['input'];
  expectedVersion: Scalars['Int']['input'];
  reason: Scalars['String']['input'];
  targetStoreId: Scalars['UUID']['input'];
};

export type SubmitUpdateStoreProposalInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  clientNonce: Scalars['String']['input'];
  expectedVersion: Scalars['Int']['input'];
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  productIds?: InputMaybe<Array<Scalars['UUID']['input']>>;
  targetStoreId: Scalars['UUID']['input'];
};

export type UpdateStoreInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  productIds?: InputMaybe<Array<Scalars['UUID']['input']>>;
  storeId: Scalars['UUID']['input'];
};

export type User = {
  __typename?: 'User';
  displayName?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  trustScore: Scalars['Int']['output'];
  userId: Scalars['UUID']['output'];
};
