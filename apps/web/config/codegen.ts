import type { CodegenConfig } from "@graphql-codegen/cli";

const GUACAL_GRAPHQL_API =
	process.env.VITE_GUACAL_GRAPHQL_API ?? "http://0.0.0.0:8080/graphql";

const config: CodegenConfig = {
	documents: "./src/**/*.graphql",
	generates: {
		"./src/": {
			plugins: [
				"typescript-operations",
				{
					"typescript-rtk-query": {
						exportHooks: true,
						importBaseApiFrom: "@/store/features/guacal-api/base",
						importBaseApiAlternateName: "gualcalGraphqlApiSlice",
					},
				},
			],
			preset: "near-operation-file",
			presetConfig: {
				baseTypesPath: "graphql/types.ts",
				extension: ".generated.ts",
			},
		},
		"./src/graphql/types.ts": {
			plugins: ["typescript"],
		},
	},
	schema: GUACAL_GRAPHQL_API,
};

export default config;
