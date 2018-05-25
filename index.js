const { setToken } = require('./requestor/config');

try {
  initToken();
} catch (e) {
  console.log(e);
  return;
}

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
  timer[org].tasks[label] = performance.now() - time;
}

async function save(type, bulkWriter, org, param) {
  // if type = Members, param = storedOrg
  // all other types, param = repo or null

  try {
    const time = performance.now();
    const data = await ghClient[`get${type}`](org, param && param.name);
    const savedData = type === 'Members'
      ? await bulkWriter(data, param)
      : await bulkWriter(data, param && param.id);

    // setTimer(type, time, org);
    return savedData;
  } catch (e) {
    return new Error(e);
  }
}

async function renderDbData(db) {
  const data = ['Organisation', 'Issue', 'Member', 'PullRequest', 'Repository',
    'Commit', 'CommunityProfile', 'ExternalContribution'
  ];

  console.log('**Count**');
  console.log('---');

  await Promise.all(data.map(async (value) => {
    console.log(`${value}: ${await db[value].count()}`);
  }));
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
  for (const project of techRadarProjects) {
    await save('ExternalContributions', bulkWriter.writeExternalContributions, project.org, project);
  }
}

async function getData() {
  renderWelcomeMessage();

  try {
    const { db, sequelize, bulkWriter } = await initDb();

    await getExternalData(bulkWriter);
    const organisations = await ghClient.getOrgs();

    for (const org of organisations) {
      timer[org['login']] = {
        totalTime: performance.now(),
        tasks: []
      };

      const storedOrg = await save('OrgDetails', bulkWriter.writeSingleOrganisation, org.login);
      let repos = await save('Repos', bulkWriter.writeRepositories, org.login);
      const trimmedRepos = repos.map(x => {
        return {
          id: x.id,
          name: x.name
        };
      });
      repos = null;

      await save('Members', bulkWriter.writeMembers, org.login, storedOrg);
      for (const repo of trimmedRepos) {
        await save('CommunityProfile', bulkWriter.writeCommunityProfile, org.login, repo);
        await save('PullRequests', bulkWriter.writePullRequests, org.login, repo);
        await save('Commits', bulkWriter.writeCommits, org.login, repo);
      }
      await save('Issues', bulkWriter.writeIssues, org.login);

      const totalTime = timer[org['login']].totalTime;
      timer[org['login']].totalTime = performance.now() - totalTime;
    }

    await bulkWriter.deleteExternalContributions(sequelize)
    timer.totalTime = performance.now() - timer.totalTime;
    await renderDbData(db);
    renderTimer();
  } catch (e) {
    console.log(e);
  }
}

getData();
