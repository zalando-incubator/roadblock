module.exports = async function(repo, context, config) {
  var issues = await context.client.Issue.getAll(repo.owner, repo.name);
  await client.Issue.bulkCreate(issues, context.externalValuesMap);

  return;
};
