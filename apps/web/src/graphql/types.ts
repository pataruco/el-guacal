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
  DateTime: { input: any; output: any; }
  UUID: { input: any; output: any; }
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
  storesNear: Array<Store>;
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
