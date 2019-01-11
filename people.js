const GithubClient = require('./github/client.js');
const DatabaseClient = require('./database/client.js');
const Client = require('./client');

const commandLineArgs = require('command-line-args');
const fetch = require('node-fetch');
const cliProgress = require('cli-progress');

const optionDefinitions = [
  { name: 'ztoken', type: String, multiple: false },
  { name: 'token', alias: 't', type: String, defaultOption: true }
];

const options = commandLineArgs(optionDefinitions);
const config = {
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

var init = async function(args) {
  // Initialize the github and database clients
  var github = new GithubClient(args.token);
  var database = await new DatabaseClient(config.db).db();
  var client = Client(github, database, false);

  //get all registered github accounts
  var githubData = await fetch(
    'https://users.auth.zalando.com/api/employees/?account=github',
    {
      method: 'get',
      headers: { Authorization: `Bearer ${args.ztoken}` }
    }
  );

  if (githubData.status !== 200) {
    throw 'Incorrect ZToken - no access to users api';
  }

  githubData = await githubData.json();
  var gh_names = {};

  for (const key in githubData) {
    const gh_name = githubData[key][0];
    gh_names[gh_name] = key;
  }

  //get all members
  var members = await client.Member.model.findAll();

  const memberProgress = new cliProgress.Bar(
    {},
    cliProgress.Presets.shades_classic
  );

  let progress = 0;
  memberProgress.start(members.length, 0);

  for (const member of members) {
    if (gh_names.hasOwnProperty(member.login)) {
      var employee_name = gh_names[member.login];
      var company_profile = await fetch(
        `https://people.zalando.net/api/people/${employee_name}`,
        {
          method: 'get',
          headers: { Authorization: `Bearer ${args.ztoken}` }
        }
      );

      company_profile = await company_profile.json();

      member.team = company_profile.team;
      member.department = company_profile.department;
      member.email = company_profile.email;
      member.name = company_profile.full_name;

      member.employee_title = company_profile.job_title;
      member.employee_id = company_profile.employee_id;
      member.employee_login = company_profile.login;

      await member.save();
    }

    progress++;
    memberProgress.update(progress);
  }

  memberProgress.stop();
};

init(options);
