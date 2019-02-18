module.exports = async function(repo, context, config) {
  await context.client.Release.destroy(repo.id);

  var releases = await context.client.Release.getAll(repo.owner, repo.name);
  await context.client.Release.bulkCreate(releases, context.externalValuesMap);

  return true;
};
