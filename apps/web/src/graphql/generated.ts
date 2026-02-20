import { api } from '../store/features/guacal-api/base';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: any; output: any };
  UUID: { input: any; output: any };
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

export enum Radius {
  Km_1 = 'KM_1',
  Km_2 = 'KM_2',
  Km_3 = 'KM_3',
  Km_5 = 'KM_5',
  Km_10 = 'KM_10',
}

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

export type GetStoresNearQueryVariables = Exact<{
  location: LocationInput;
  radius: Radius;
}>;

export type GetStoresNearQuery = {
  __typename?: 'Query';
  storesNear: Array<{
    __typename?: 'Store';
    name: string;
    location: { __typename?: 'Location'; lat: number; lng: number };
    products: Array<{ __typename?: 'Product'; name: string }>;
  }>;
};

export const GetStoresNearDocument = `
    query GetStoresNear($location: LocationInput!, $radius: Radius!) {
  storesNear(location: $location, radius: $radius) {
    name
    location {
      lat
      lng
    }
    products {
      name
    }
  }
}
    `;

const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    GetStoresNear: build.query<GetStoresNearQuery, GetStoresNearQueryVariables>(
      {
        query: (variables) => ({ document: GetStoresNearDocument, variables }),
      },
    ),
  }),
});

export { injectedRtkApi as api };
export const { useGetStoresNearQuery, useLazyGetStoresNearQuery } =
  injectedRtkApi;
