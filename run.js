//Client to talk to github api
const GithubClient = require('./github/client.js');
const DatabaseClient = require('./database/client.js');

//Classes for handling each type of data from github
const Organisation = require('./client/organisation.js');

//misc libraries needed...
const fs = require('fs');

//temporary config object - we will remove later
const config = {
  db: {
    database: 'roadblock',
    dialect: 'sqlite',
    storage: './data/db2.sqlite'
  }
};

async function init() {
  var token = process.argv[2];
  if (!token) {
    throw 'Github token argument is empty, please provide a token. `node run.js <token>`';
  }

  var github = new GithubClient(token);
  var database = new DatabaseClient(config.db).db();

  var org = new Organisation(github, database);
  org.sync(true);

  database.sync();

  var orgs = await org.getAll();
  for (const org in orgs) {
    console.log(org);
  }
}

init();
