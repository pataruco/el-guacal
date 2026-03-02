import type { CodegenConfig } from '@graphql-codegen/cli';

const GUACAL_GRAPHQL_API =
  process.env.VITE_GUACAL_GRAPHQL_API ?? 'http://0.0.0.0:8080/graphql';

const config: CodegenConfig = {
  documents: './app/**/*.graphql',
  generates: {
    './app/': {
      plugins: [
        'typescript-operations',
        {
          'typescript-rtk-query': {
            exportHooks: true,
            importBaseApiAlternateName: 'gualcalGraphqlApiSlice',
            importBaseApiFrom: '@/store/features/guacal-api/base',
          },
        },
      ],
      preset: 'near-operation-file',
      presetConfig: {
        baseTypesPath: 'graphql/types.ts',
        extension: '.generated.ts',
      },
    },
    './app/graphql/types.ts': {
      config: {
        enumsAsTypes: true,
      },
      plugins: ['typescript'],
    },
  },
  schema: GUACAL_GRAPHQL_API,
};

export default config;
