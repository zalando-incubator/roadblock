module.exports = async function(repo, context, config) {
  var prs = await context.client.PullRequest.getAll(repo.owner, repo.name);
  await context.client.PullRequest.bulkCreate(prs);

  return;
};
