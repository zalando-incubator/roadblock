module.exports = async function(repo, context, config) {
  var commits = await context.client.Commit.getAll(repo.owner, repo.name);
  await context.client.Commit.bulkCreate(commits, context.externalValuesMap);

  return true;
};
