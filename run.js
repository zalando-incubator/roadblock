// Client to talk to github api
const GithubClient = require('./github/client.js');
const DatabaseClient = require('./database/client.js');
const Client = require('./client');
const ExportClient = require('./export/client.js');

// temporary config object - we will remove later
const config = {
  db: {
    database: 'roadblock',
    dialect: 'sqlite',
    storage: './data/db2.sqlite'
  },

  export: {
    storage: './data/'
  },

  externalProjects: require('./config/tech-radar.js')
};

async function init() {
  var token = process.argv[2];
  if (!token) {
    throw 'Github token argument is empty, please provide a token. `node run.js <token>`';
  }

  // Initialize the github and database clients
  var github = new GithubClient(token);
  var database = await new DatabaseClient(config.db).db();
  var client = Client(github, database);
  var exportClient = new ExportClient(database, config.export);

  await client.ExternalContribution.getAndStore(config.externalProjects);
  await client.ExternalContribution.removeContributionsWithoutMembers();

  /*
  var orgs = await client.Organisation.getForUser();

  // Iterate through all orgs and collect members and repos
  for (let org of orgs) {
    if (org.login !== 'umbraco') {
      // Get the org details and save it
      org = await client.Organisation.getDetails(org.login);
      org = await client.Organisation.saveOrUpdate(org);

      // Get all members in the org and save them
      // var membersInOrg = await client.Member.getAll(org.login);
      // client.Member.bulkCreate(membersInOrg, org);

      // Get all repositories in the org and save them
      var reposInOrg = await client.Repository.getAll(org.login);
      reposInOrg = await client.Repository.bulkCreate(reposInOrg);

      // Get all issues for the entire organisation
      var issuesInOrg = await client.Issue.getAll(org.login);
      await client.Issue.bulkCreate(issuesInOrg);

      for (const repo of reposInOrg) {
        // Get Collaborators on the repo
        var collaborators = await client.Collaborator.getAll(
          org.login,
          repo.name
        );
        await client.Collaborator.bulkCreate(collaborators, repo.id);

        // Get PRs on each repo
        var prs = await client.PullRequest.getAll(org.login, repo.name);
        await client.PullRequest.bulkCreate(prs);

        // Get All commits
        var commits = await client.Commit.getAll(org.login, repo.name);
        await client.Commit.bulkCreate(commits);

        // Get All contributions
        var contributions = await client.Contribution.getAll(
          org.login,
          repo.name
        );
        await client.Contribution.bulkCreate(contributions);

        // Community Profile
        var profiles = await client.CommunityProfile.getAll(
          org.login,
          repo.name
        );
        await client.CommunityProfile.bulkCreate(profiles);
      }
    }
  }

  // Finally when everything has been saved to the Database,
  // extract json files with the full dataset
  exportClient.export();*/
}

init();
