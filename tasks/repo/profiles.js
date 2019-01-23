module.exports = async function(repo, context, config) {
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
