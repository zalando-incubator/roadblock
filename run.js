// Client to talk to github api
const GithubClient = require('./github/client.js');
const DatabaseClient = require('./database/client.js');
const Client = require('./client');
const ExportClient = require('./export/client.js');
const cliProgress = require('cli-progress');
const { performance } = require('perf_hooks');
const commandLineArgs = require('command-line-args');

const config = {
  github: {
    token: '',
    url: 'https://api.github.com'
  },

  ztoken: '',
  tasks: ['*'],
  orgs: ['*'],

  db: {
    database: 'roadblock',
    dialect: 'sqlite',
    storage: './data/db.sqlite'
  },

  export: {
    storage: './data/'
  },

  externalProjects: require('./config/upstream.js')
};

const optionDefinitions = [
  { name: 'orgs', type: String, multiple: true, defaultValue: ['*'] },
  { name: 'token', alias: 't', type: String, defaultOption: true },
  { name: 'tasks', type: String, multiple: true, defaultValue: ['*'] },
  { name: 'url', type: String, defaultValue: 'https://api.github.com' }
];

const barlogger = function() {
  const result = {};
  result.log = () => {
    process.stdout.write('.');
  };
  return result;
};

const runTask = function(task, filter) {
  if (filter.indexOf(`!${task}`) > -1) return false;
  if (filter === '*' || filter.indexOf('*') > -1 || filter.indexOf(task) > -1)
    return true;

  return false;
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
  const options = commandLineArgs(optionDefinitions);

  if (!options.token) {
    throw 'Github token argument is empty, please provide a token. `node run.js <token>`';
  }

  // Initialize the github and database clients
  var github = new GithubClient(options.token, options.url);
  var database = await new DatabaseClient(config.db).db();
  var client = Client(github, database, true);
  var exportClient = new ExportClient(database, config.export);

  var start = performance.now();
  var orgs = await client.Organisation.getForUser();
  var months = await client.Calendar.getAll(2014);
  await client.Calendar.bulkCreate(months);

  // Iterate through all orgs and collect members and repos
  for (let org of orgs) {
    if (runTask(org.login, options.orgs)) {
      console.log(` ⬇️  Downloading ${org.login}`);

      // Get the org details and save it
      org = await client.Organisation.getDetails(org.login);
      org = await client.Organisation.saveOrUpdate(org);

      console.log(` ⬇️  Downloading ${org.login} repositories`);
      // Get all repositories in the org and save them
      var githubRepositories = await client.Repository.getAll(org.login);

      console.log(
        ` ✅  Saving ${githubRepositories.length} ${org.login} repositories`
      );
      await client.Repository.bulkCreate(githubRepositories);

      var repositories = await org.getRepositories();
      repositories = repositories.filter(y => {
        return !y.fork;
      });

      timePassed(start);

      if (runTask('members', options.tasks)) {
        // Get all members in the org and save them
        console.log(` ⬇️  Downloading ${org.login} members`);
        var membersInOrg = await client.Member.getAll(org.login, barlogger());

        console.log(` ✅  Saving ${membersInOrg.length} ${org.login} members`);
        await client.Member.bulkCreate(membersInOrg, org);

        timePassed(start);
      }

      const repoProgress = new cliProgress.Bar(
        {},
        cliProgress.Presets.shades_classic
      );
      let progress = 0;

      console.log(
        ` ⬇️  Downloading repository data from ${org.login} repositories`
      );
      repoProgress.start(repositories.length, 0);
      // For each repo we must collect repo-specific info

      for (const repository of repositories) {
        var tasks = [];
        var externalValuesMap = { repository_id: repository.id };

        if (runTask('collaborators', options.tasks)) {
          tasks.push(async repo => {
            try {
              // Get Collaborators on the repo
              var collaborators = await client.Collaborator.getAll(
                org.login,
                repo.dataValues.name
              );

              client.Collaborator.bulkCreate(collaborators, externalValuesMap);
            } catch (e) {
              console.warn(
                `Failed getting Collaborators for ${
                  repo.dataValues.name
                } : ${e}`
              );
            }
          });
        }

        if (runTask('topics', options.tasks)) {
          tasks.push(async repo => {
            // Get Topics on each repo - save it directly on the repository model
            var topics = await client.Topic.getAll(org.login, repo.name);
            await client.Topic.bulkCreate(topics, repo);
          });
        }

        if (runTask('pullrequests', options.tasks)) {
          tasks.push(async repo => {
            // Get PRs on each repo
            var prs = await client.PullRequest.getAll(org.login, repo.name);
            await client.PullRequest.bulkCreate(prs);
          });
        }

        if (runTask('releases', options.tasks)) {
          tasks.push(async repo => {
            // Get release history on each repo
            var releases = await client.Release.getAll(org.login, repo.name);
            await client.Release.bulkCreate(releases, externalValuesMap);
          });
        }

        if (runTask('commits', options.tasks)) {
          tasks.push(async repo => {
            // Get All commits
            var commits = await client.Commit.getAll(org.login, repo.name);
            await client.Commit.bulkCreate(commits, externalValuesMap);
          });
        }

        if (runTask('contributions', options.tasks)) {
          tasks.push(async repo => {
            // Get All contributions
            var contributions = await client.Contribution.getAll(
              org.login,
              repo.name
            );

            await client.Contribution.bulkCreate(
              contributions,
              externalValuesMap
            );
          });
        }

        if (runTask('profiles', options.tasks)) {
          tasks.push(async repo => {
            // Community Profile
            var profiles = await client.CommunityProfile.getAll(
              org.login,
              repo.name
            );
            await client.CommunityProfile.bulkCreate(
              profiles,
              externalValuesMap
            );
          });
        }

        if (runTask('issues', options.tasks)) {
          tasks.push(async repo => {
            // Get All issues from the repo
            var issues = await client.Issue.getAll(org.login, repo.name);
            await client.Issue.bulkCreate(issues, externalValuesMap);
          });
        }

        var awaitingTasks = tasks.map(async x => x(repository));
        await Promise.all(awaitingTasks);

        progress++;
        repoProgress.update(progress);
      }

      repoProgress.stop();
      timePassed(start);
    }
  }

  if (
    options.url === 'https://api.github.com' &&
    runTask('upstream', options.tasks)
  ) {
    console.log(
      ' ⬇️  Downloading external contribution data from external repositories'
    );

    // Get all our external projects which we might contribute to
    await client.ExternalContribution.getAndStore(config.externalProjects);

    // Clean up external contributions so it is only those that fit our members
    await client.ExternalContribution.removeContributionsWithoutMembers();
  }

  if (runTask('export', options.tasks)) {
    console.log(' 💾  Exporting statistics as json to /data');
    // Finally when everything has been saved to the Database,
    // extract json files with the full dataset
    exportClient.export();
  }

  console.log('########  COMPLETE ########');
  timePassed(start);
}

init();
