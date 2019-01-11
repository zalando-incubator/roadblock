module.exports = async function(repo, context, config) {
  var contributions = await context.client.Contribution.getAll(
    repo.owner,
    repo.name
  );

  await client.Contribution.bulkCreate(
    contributions,
    context.externalValuesMap
  );

  return;
};
