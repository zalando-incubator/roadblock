const { setToken } = require('./requestor/config').default,
  fs = require('fs'),
  sequelize = require('sequelize');

try {
  initToken();
} catch (e) {
  console.log(e);
  return;
}

import Organisation from './client/organisation.js';

const { performance } = require('perf_hooks');
const store = require('./storage');
const ghClient = require('./requestor');
const writer = require('./storage/writer');
const techRadarProjects = require('./requestor/tech-radar');

const timer = {
  totalTime: performance.now()
};

function renderWelcomeMessage() {
  console.log('                     _ _     _            _    ');
  console.log('                    | | |   | |          | |   ');
  console.log(' _ __ ___   __ _  __| | |__ | | ___   ___| | __');
  console.log("| '__/ _ \\ / _` |/ _` | '_ \\| |/ _ \\ / __| |/ /"); // eslint-disable-line quotes
  console.log('| | | (_) | (_| | (_| | |_) | | (_) | (__|   < ');
  console.log('|_|  \\___/ \\__,_|\\__,_|_.__/|_|\\___/ \\___|_|\\_\\');
}

function initToken() {
  const ghToken = process.argv[2];

  if (!ghToken) {
    throw 'Github token argument is empty, please provide a token. `node index.js <token>`';
  }

  setToken(ghToken);
}

async function initDb() {
  const { _models: db, sequelize } = await store.connect();
  const bulkWriter = await writer.init(db);

  // Syncs the schema changes to the db
  // Only force if there is a reason to drop all data
  await store.syncSchema(true);

  return {
    db,
    sequelize,
    bulkWriter
  };
}

function setTimer(label, time, org) {
  const orgTimer = timer[org];

  if (orgTimer) {
    timer[org].tasks[label] = performance.now() - time;
  } else {
    timer['external contributions'] = performance.now() - time;
  }
}

async function save(type, bulkWriter, org, param) {
  // if type = Members, param = storedOrg
  // all other types, param = repo or null
  // if type = ExternalContributions, param.id = null

  try {
    const time = performance.now();
    const data = await ghClient[`get${type}`](org, param && param.name);
    const savedData =
      type === 'Members'
        ? await bulkWriter(data, param)
        : await bulkWriter(data, param && (param.id || param.name));

    setTimer(type, time, org);
    return savedData;
  } catch (e) {
    return new Error(e);
  }
}

async function renderDbData(db) {
  const data = [
    'Organisation',
    'Issue',
    'Member',
    'PullRequest',
    'Repository',
    'Commit',
    'CommunityProfile',
    'ExternalContribution',
    'Collaborator',
    'Contribution'
  ];

  console.log('**Count**');
  console.log('---');

  await Promise.all(
    data.map(async value => {
      console.log(`${value}: ${await db[value].count()}`);
    })
  );
}

async function exportDbData(db) {
  // create a repo file listing the 100 most active projects
  var repos = await db.Repository.findAll({
    limit: 100,
    order: sequelize.literal('(forks+stars+watchers) DESC')
  });

  repos = repos.map(x => x.dataValues);
  fs.writeFile(
    'data/repositories.json',
    JSON.stringify(repos, null, 2),
    'utf8'
  );

  // organisation stats
  var orgs = await db.Organisation.findAll();
  orgs = orgs.map(x => x.dataValues);
  fs.writeFile(
    'data/organisations.json',
    JSON.stringify(orgs, null, 2),
    'utf8'
  );

  // general statistics

  var stats = {};
  stats.stars = await db.Repository.sum('stars');
  stats.projects = await db.Repository.count();
  stats.languages = await db.Repository.count({
    col: 'language',
    distinct: true
  });
  stats.forks = await db.Repository.sum('forks');
  stats.members = await db.Member.count();
  stats.contributors = await db.Contribution.count({
    col: 'user_id',
    distinct: true
  });

  fs.writeFile('data/statistics.json', JSON.stringify(stats, null, 2), 'utf8');

  //TODO: write this to the database for snapshots of stats over time
}

function renderTimer(param) {
  const obj = param || timer;

  if (!param) {
    console.log('');
    console.log('**Time**');
    console.log('---');
  }

  for (const key in obj) {
    const value = obj[key];

    if (Array.isArray(value)) {
      console.log('tasks: ', value);
    } else if (typeof value === 'object') {
      console.log(key);
      console.log('---');
      console.log('');
      renderTimer(timer[key]);
    } else {
      console.log(`${key}: ${value}`);
    }
  }
}

async function getExternalData(bulkWriter) {
  try {
    for (const project of techRadarProjects) {
      await save(
        'ExternalContributions',
        bulkWriter.writeExternalContributions,
        project.org,
        project
      );
    }
  } catch (e) {
    return new Error(e);
  }
}

async function getMemberRepositories(members, bulkWriter) {
  try {
    for (const member of members) {
      var pushEvents = await ghClient.getMemberPushEvents(member.login);
      var repos = [];

      var mappedRepos = pushEvents
        .filter(
          x =>
            x.type === 'PushEvent' &&
            x.repo &&
            x.repo.name &&
            !repos.includes(x.repo.name)
        )
        .map(x => {
          repos.push(x.repo.name);

          return {
            user_id: member.id,
            user_login: member.login,
            repository_id: x.repo.id,
            repository_name: x.repo.name
          };
        });

      if (mappedRepos.length > 0) {
        await bulkWriter.writeMemberRepositories(mappedRepos);
      }
    }
  } catch (e) {
    return new Error(e);
  }
}

async function getData() {
  renderWelcomeMessage();

  try {
    const { db, sequelize, bulkWriter } = await initDb();

    // await getExternalData(bulkWriter);
    const organisations = await ghClient.getOrgs();

    // Fetch all organisations which the active token has access to
    for (const org of organisations) {
      timer[org['login']] = {
        totalTime: performance.now(),
        tasks: []
      };

      // Fetch details on the organisation to get forks, stars, etc
      const storedOrg = await save(
        'OrgDetails',
        bulkWriter.writeSingleOrganisation,
        org.login
      );

      // Fetch all members in the current organisation
      await save('Members', bulkWriter.writeMembers, org.login, storedOrg);

      //collect all member repositories
      var allMembersResponse = await db.Member.findAll();
      var allMembers = allMembersResponse.map(x => x.dataValues);
      await getMemberRepositories(allMembers, bulkWriter);

      // Fetch all repositories in the current org
      let repos = await save('Repos', bulkWriter.writeRepositories, org.login);

      // Store the repository name, id for future queries and discard the rest
      const trimmedRepos = repos.map(x => {
        return {
          id: x.id,
          name: x.name
        };
      });
      repos = null;

      // For each repo, fetch all repository specific data like -
      // profiles, prs, commits and collaborators
      for (const repo of trimmedRepos) {
        // Fetch community statistics on presence of COC, readme, templates and license file

        await save(
          'CommunityProfile',
          bulkWriter.writeCommunityProfile,
          org.login,
          repo
        );

        // Fetch all pull requests for the repository and save them in the PullRequest table
        await save(
          'PullRequests',
          bulkWriter.writePullRequests,
          org.login,
          repo
        );

        // Fetch all commits for the repository
        await save('Commits', bulkWriter.writeCommits, org.login, repo);

        /// Get all collaborators for each repository
        await save(
          'Collaborators',
          bulkWriter.writeCollaborators,
          org.login,
          repo
        );

        // Get all contributions for the repository
        await save(
          'Contributions',
          bulkWriter.writeContributions,
          org.login,
          repo
        );
      }

      // Fetch all issues for the entire organisation
      await save('Issues', bulkWriter.writeIssues, org.login);

      // Log how much time it took to fetch all data for a organisation
      const totalTime = timer[org['login']].totalTime;
      timer[org['login']].totalTime = performance.now() - totalTime;
    }

    // Clean-up ExternalContributions table to have only contributions from org members
    await bulkWriter.deleteExternalContributions(sequelize);

    timer.totalTime = performance.now() - timer.totalTime;
    await renderDbData(db);
    await exportDbData(db);
    renderTimer();
  } catch (e) {
    console.log(e);
  }
}

getData();
