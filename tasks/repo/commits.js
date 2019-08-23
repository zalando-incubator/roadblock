module.exports = async function(repo, context, config) {
  context.ui.bar.increment(0, { state: "Running 'Commits on: " + repo.name });

  await context.client.Commit.destroy(repo.id);

  var commits = await context.client.Commit.getAll(repo.owner, repo.name);
  await context.client.Commit.bulkCreate(commits, context.externalValuesMap);

  return true;
};
