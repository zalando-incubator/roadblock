module.exports = async function(repo, context, config) {
  await context.client.Topic.destroy(repo.id);

  var topics = await context.client.Topic.getAll(repo.owner, repo.name);
  await context.client.Topic.bulkCreate(topics, repo);

  return true;
};
