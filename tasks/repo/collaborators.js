module.exports = async function(repo, context, config) {
  var collaborators = await context.client.Collaborator.getAll(
    repo.owner,
    repo.name
  );

  context.client.Collaborator.bulkCreate(
    collaborators,
    context.externalValuesMap
  );

  return true;
};
