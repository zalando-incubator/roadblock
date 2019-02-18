module.exports = async function(repo, context, config) {
  await context.client.CommunityProfile.destroy(repo.id);

  // Community Profile
  var profiles = await context.client.CommunityProfile.getAll(
    repo.owner,
    repo.name
  );

  await context.client.CommunityProfile.bulkCreate(
    profiles,
    context.externalValuesMap
  );

  return true;
};
