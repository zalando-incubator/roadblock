// Classes for handling each type of data from github
const Organisation = require('./organisation.js');
const Repository = require('./repository.js');
const Member = require('./member.js');
const Collaborator = require('./collaborator.js');
const PullRequest = require('./pullrequest.js');
const Commit = require('./commit.js');
const Contribution = require('./contribution.js');
const Issue = require('./issue.js');
const CommunityProfile = require('./communityprofile.js');
const ExternalContribution = require('./externalcontribution.js');
const Topic = require('./topic.js');
const Release = require('./release.js');
const Calendar = require('./calendar.js');
const Vulnerability = require('./vulnerability.js');

const Base = require('./base.js');

module.exports = async function(
  github,
  database,
  reset = false,
  externalTypes = []
) {
  var s = {};

  s.ClientBase = Base;

  //Setup helper calendar table for grouping activity based on months
  s.Calendar = new Calendar(github, database);
  s.Calendar.define();

  // Initialize the clients for each individual github api object
  s.Organisation = new Organisation(github, database);
  s.Organisation.define();

  s.Repository = new Repository(github, database);
  s.Repository.define();

  s.Member = new Member(github, database);
  s.Member.define();

  s.Collaborator = new Collaborator(github, database);
  s.Collaborator.define();

  s.PullRequest = new PullRequest(github, database);
  s.PullRequest.define();

  s.Commit = new Commit(github, database);
  s.Commit.define();

  s.Contribution = new Contribution(github, database);
  s.Contribution.define();

  s.Issue = new Issue(github, database);
  s.Issue.define();

  s.CommunityProfile = new CommunityProfile(github, database);
  s.CommunityProfile.define();

  s.ExternalContribution = new ExternalContribution(github, database);
  s.ExternalContribution.define();

  s.Topic = new Topic(github, database);
  s.Topic.define();

  s.Release = new Release(github, database);
  s.Release.define();

  s.Vulnerability = new Vulnerability(github, database);
  s.Vulnerability.define();

  for (const client of externalTypes) {
    try {
      var cl = new client(github, database);
      s[client.name] = cl;
      s[client.name].define();
    } catch (ex) {
      console.log(ex);
    }
  }

  // finally sync the database so all schemas are in place
  s.Calendar.sync(reset);

  s.Repository.sync(reset);
  s.Member.sync(reset);
  s.Organisation.sync(reset);
  s.Collaborator.sync(reset);
  s.PullRequest.sync(reset);
  s.Commit.sync(reset);
  s.Contribution.sync(reset);
  s.Issue.sync(reset);
  s.CommunityProfile.sync(reset);
  s.ExternalContribution.sync(reset);
  s.Topic.sync(reset);
  s.Release.sync(reset);
  s.Vulnerability.sync(reset);

  for (const client of externalTypes) {
    try {
      s[client.name].sync(reset);
    } catch (ex) {}
  }

  await database.sync({ force: reset });
  return s;
};
