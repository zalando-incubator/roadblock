var util = require('../../util.js');

module.exports = async function(org, context, config) {
  console.log(`  ⬇️   Downloading ${org.login} repositories`);

  // Get all repositories in the org and save them
  var githubRepositories = await context.client.Repository.getAll(org.login);

  console.log(
    `  ✅   Saving ${githubRepositories.length} ${org.login} repositories`
  );

  await context.client.Repository.bulkCreate(githubRepositories);

  util.timePassed(context.start);
  return;
};
