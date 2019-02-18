module.exports = async function(repo, context, config) {
  await context.client.Blame.destroy(repo.id);
  var blame = await context.client.Blame.getAll(repo.owner, repo.name);
  await context.client.Blame.bulkCreate(blame, context.externalValuesMap);
  return true;
};
