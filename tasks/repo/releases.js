module.exports = async function(repo, context, config) {
  var releases = await context.client.Release.getAll(repo.owner, repo.name);
  await context.client.Release.bulkCreate(releases, context.externalValuesMap);

  return;
};
