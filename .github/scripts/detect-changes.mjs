const main = async ({ github, context, core }) => {
	const { data: files } = await github.rest.pulls.listFiles({
		owner: context.repo.owner,
		repo: context.repo.repo,
		pull_number: context.payload.pull_request.number,
		per_page: 100,
	});

	const changedPaths = files.map((f) => f.filename);
	const web = changedPaths.some((p) => p.startsWith("apps/web/"));
	const server = changedPaths.some((p) => p.startsWith("apps/server/"));

	core.info(`Changed files: ${changedPaths.join(", ")}`);
	core.info(`web changed: ${web}`);
	core.info(`server changed: ${server}`);

	core.setOutput("web", String(web));
	core.setOutput("server", String(server));
};

export default main;
