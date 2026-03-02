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
  createStore: Store;
  deleteStore: Scalars['Boolean']['output'];
  updateStore: Store;
};


export type MutationCreateStoreArgs = {
  input: CreateStoreInput;
};


export type MutationDeleteStoreArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationUpdateStoreArgs = {
  input: UpdateStoreInput;
};

export type Product = {
  __typename?: 'Product';
  brand: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  productId: Scalars['UUID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Query = {
  __typename?: 'Query';
  allProducts: Array<Product>;
  getStoreById?: Maybe<Store>;
  storesNear: Array<Store>;
};


export type QueryGetStoreByIdArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryStoresNearArgs = {
  location: LocationInput;
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

export type Store = {
  __typename?: 'Store';
  address: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  location: Location;
  name: Scalars['String']['output'];
  products: Array<Product>;
  storeId: Scalars['UUID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type UpdateStoreInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  productIds?: InputMaybe<Array<Scalars['UUID']['input']>>;
  storeId: Scalars['UUID']['input'];
};
