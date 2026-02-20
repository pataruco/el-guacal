import type { CodegenConfig } from '@graphql-codegen/cli';

const GUACAL_GRAPHQL_API =
  process.env.VITE_GOOGLE_MAPS_API_KEYGUACAL_GRAPHQL_API ??
  'http://0.0.0.0:8080/graphql';

// const config: CodegenConfig = {
// 	documents: ["website/src/graphql/**/*.graphql"],
// 	generates: {
// 		"website/src/graphql/": {
// 			config: {
// 				withResultType: true,
// 			},
// 			overwrite: true,
// 			plugins: ["typescript-operations", "typed-document-node"],
// 			preset: "near-operation-file",
// 			presetConfig: {
// 				baseTypesPath: "types.ts",
// 				extension: ".generated.ts",
// 			},
// 		},
// 		"website/src/graphql/types.ts": {
// 			overwrite: true,
// 			plugins: ["typescript"],
// 		},
// 	},
// 	schema: {
// 		[GUACAL_GRAPHQL_API]: {},
// 	},
// };
//
const config: CodegenConfig = {
  documents: './src/**/*.graphql',
  generates: {
    './src/graphql/generated.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        {
          'typescript-rtk-query': {
            exportHooks: true,
            importBaseApiFrom: '../store/features/guacal-api/base',
          },
        },
      ],
    },
  },
  schema: GUACAL_GRAPHQL_API,
};

export default config;
