// Client to talk to github api
const GithubClient = require('./github/client.js');
const DatabaseClient = require('./database/client.js');
const Client = require('./client');
const ExportClient = require('./export/client.js');
const cliProgress = require('cli-progress');
const { performance } = require('perf_hooks');

// temporary config object - we will remove later
const config = {
  db: {
    database: 'roadblock',
    dialect: 'sqlite',
    storage: './data/db.sqlite'
  },

  export: {
    storage: './data/'
  },

  externalProjects: require('./config/tech-radar.js')
};

const barlogger = function() {
  const result = {};
  result.log = () => {
    process.stdout.write('.');
  };
  return result;
};

const timePassed = function(startTime) {
  var duration = performance.now() - startTime;

  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;

  console.log(
    ` ⏱  Time passed: ${hours}:${minutes}:${seconds}.${milliseconds}`
  );
};

async function init() {
  var token = process.argv[2];
  var orgsFilter = process.argv[3];
  var tasksFilter = process.argv[4];

  if (tasksFilter && tasksFilter !== '*') {
    tasksFilter = tasksFilter.split(',');
  }

  if (orgsFilter && orgsFilter !== '*') {
    orgsFilter = orgsFilter.split(',');
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
    if (orgs === '*' || orgsFilter.indexOf(org.login) >= 0) {
      console.log(` ⬇️  Downloading ${org.login}`);

      // Get the org details and save it
      org = await client.Organisation.getDetails(org.login);
      org = await client.Organisation.saveOrUpdate(org);

      console.log(` ⬇️  Downloading ${org.login} repositories`);
      // Get all repositories in the org and save them
      var reposInOrg = await client.Repository.getAll(org.login);

      console.log(` ✅  Saving ${reposInOrg.length} ${org.login} repositories`);
      reposInOrg = await client.Repository.bulkCreate(reposInOrg);

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

      console.log(
        ` ⬇️  Downloading repository data from ${org.login} repositories`
      );
      repoProgress.start(reposInOrg.length, 0);
      // For each repo we must collect repo-specific info

      for (const r of reposInOrg) {
        var tasks = [];

        tasks.push(async repo => {
          try {
            // Get Collaborators on the repo
            var collaborators = await client.Collaborator.getAll(
              org.login,
              repo.name
            );
            client.Collaborator.bulkCreate(collaborators, repo.id);
          } catch (e) {
            console.warn(
              `Failed getting Collaborators for ${repo.name} : ${e}`
            );
          }
        });

        tasks.push(async repo => {
          // Get PRs on each repo
          var prs = await client.PullRequest.getAll(org.login, repo.name);
          await client.PullRequest.bulkCreate(prs);
        });

        tasks.push(async repo => {
          // Get All commits
          var commits = await client.Commit.getAll(org.login, repo.name);
          await client.Commit.bulkCreate(commits);
        });

        tasks.push(async repo => {
          // Get All contributions
          var contributions = await client.Contribution.getAll(
            org.login,
            repo.name
          );
          contributions.map(contrib => {
            contrib.repository_id = repo.id;
          });

          await client.Contribution.bulkCreate(contributions);
        });

        tasks.push(async repo => {
          // Community Profile
          var profiles = await client.CommunityProfile.getAll(
            org.login,
            repo.name
          );
          await client.CommunityProfile.bulkCreate(profiles);
        });

        tasks.push(async repo => {
          // Get All commits
          var commits = await client.Commit.getAll(org.login, repo.name);
          await client.Commit.bulkCreate(commits);
        });

        tasks.push(async repo => {
          // Get All issues from the repo
          var issues = await client.Issue.getAll(org.login, repo.name);
          await client.Issue.bulkCreate(issues);
        });

        var awaitingTasks = tasks.map(async x => await x(r));
        await Promise.all(awaitingTasks);

        progress++;
        repoProgress.update(progress);
      }

      repoProgress.stop();
      timePassed(start);
    }
  }

  console.log(
    ' ⬇️  Downloading external contribution data from external repositories'
  );
  // Get all our external projects which we might contribute to
  await client.ExternalContribution.getAndStore(config.externalProjects);

  // Clean up external contributions so it is only those that fit our members
  await client.ExternalContribution.removeContributionsWithoutMembers();

  console.log(' 💾  Exporting statistics as json to /data');
  // Finally when everything has been saved to the Database,
  // extract json files with the full dataset
  exportClient.export();

  console.log('########  COMPLETE ########');
  timePassed(start);
}

init();
