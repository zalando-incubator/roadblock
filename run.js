// Client to talk to github api
const GithubClient = require('./github/client.js');
const DatabaseClient = require('./database/client.js');
const Client = require('./client');
const ExportClient = require('./export/client.js');
const cliProgress = require('cli-progress');

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

const barlogger = function() {
  const result = {};

  result.log = (level, message, data) => {
    process.stdout.write('.');
  };

  return result;
};

const timePassed = function(startTime) {
  var duration = startTime - performance.now();

  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;

  console.log(
    ' ⏱  Time passed: ' +
      hours +
      ':' +
      minutes +
      ':' +
      seconds +
      '.' +
      milliseconds
  );
};

async function init() {
  var token = process.argv[2];
  var orgs = process.argv[3];
  var tasks = process.argv[4];

  if (tasks && tasks !== '*') {
    tasks = tasks.split(',');
  }

  if (orgs && orgs !== '*') {
    orgs = orgs.split(',');
  }

  if (!token) {
    throw 'Github token argument is empty, please provide a token. `node run.js <token>`';
  }

  // Initialize the github and database clients
  var github = new GithubClient(token);
  var database = await new DatabaseClient(config.db).db();
  var client = Client(github, database, true);
  var exportClient = new ExportClient(database, config.export);

  var start = performance.now();

  var orgs = await client.Organisation.getForUser();

  // Iterate through all orgs and collect members and repos
  for (let org of orgs) {
    if (org.login !== 'umbraco') {
      console.log(` ⬇️  Downloading ${org.login}`);

      // Get the org details and save it
      org = await client.Organisation.getDetails(org.login);
      org = await client.Organisation.saveOrUpdate(org);

      console.log(` ⬇️  Downloading ${org.login} repositories`);
      // Get all repositories in the org and save them
      var reposInOrg = await client.Repository.getAll(org.login);

      console.log(` ✅  Saving ${reposInOrg.length} ${org.login} repositories`);
      reposInOrg = await client.Repository.bulkCreate(reposInOrg);

      // Get all issues for the entire organisation
      console.log(` ⬇️  Downloading ${org.login} issues`);
      var issuesInOrg = await client.Issue.getAll(org.login, barlogger());

      console.log(` ✅  Saving ${issuesInOrg.length} ${org.login} issues`);
      await client.Issue.bulkCreate(issuesInOrg);

      timePassed(start);

      // Get all members in the org and save them
      console.log(` ⬇️  Downloading ${org.login} members`);
      var membersInOrg = await client.Member.getAll(org.login, barlogger());

      console.log(` ✅  Saving ${membersInOrg.length} ${org.login} members`);
      await client.Member.bulkCreate(membersInOrg, org);

      timePassed(start);

      const repoProgress = new cliProgress.Bar(
        {},
        cliProgress.Presets.shades_classic
      );
      let progress = 0;

      repoProgress.start(reposInOrg.length, 0);
      // For each repo we must collect repo-specific info

      console.log(
        ` ⬇️  Downloading repository data from ${org.login} repositories`
      );
      for (const repo of reposInOrg) {
        try {
          // Get Collaborators on the repo
          var collaborators = await client.Collaborator.getAll(
            org.login,
            repo.name
          );
          await client.Collaborator.bulkCreate(collaborators, repo.id);
        } catch (e) {
          console.warn(
            'Failed getting Collaborators for ' + repo.name + ': ' + e
          );
        }
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
        contributions.map(contrib => {
          contrib.repository_id = repo.id;
        });

        await client.Contribution.bulkCreate(contributions);

        // Community Profile
        var profiles = await client.CommunityProfile.getAll(
          org.login,
          repo.name
        );
        await client.CommunityProfile.bulkCreate(profiles);

        progress++;

        repoProgress.update(progress);
      }

      repoProgress.stop();

      timePassed(start);
    }
  }

  // Get all our external projects which we might contribute to
  await client.ExternalContribution.getAndStore(config.externalProjects);

  // Clean up external contributions so it is only those that fit our members
  await client.ExternalContribution.removeContributionsWithoutMembers();

  // Finally when everything has been saved to the Database,
  // extract json files with the full dataset
  exportClient.export();

  console.log('########  COMPLETE ########');
  timePassed(start);
}

init();
