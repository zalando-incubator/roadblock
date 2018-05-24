const ghrequestor = require('ghrequestor');
const { token, api } = require('./config').config;
const headers = { authorization: `token ${token}` };
const previewHeaders = {
  ...headers,
  accept: 'application/vnd.github.black-panther-preview+json'
};
const requestorTemplate = ghrequestor.defaults({
  headers,
  logger: logger()
});
const requestorTemplatePreview = ghrequestor.defaults({
  headers: previewHeaders,
  logger: logger()
});

async function getOrgDetails(org) {
  try {
    const response = await requestorTemplate.get(api.organisation(org));
    return response.body;
  } catch (e) {
    return new Error(e);
  }
}

async function getOrgs() {
  try {
    const response = await requestorTemplate.get(api.organisations);
    return response.body;
  } catch (e) {
    return new Error(e);
  }
}

async function getRepos(org) {
  try {
    const response = await requestorTemplate.get(api.repositories(org));
    return response.body;
  } catch (e) {
    return new Error(e);
  }
}

async function getPullRequests(org, repo) {
  try {
    return await requestorTemplate.getAll(api.pullRequests(org, repo));
  } catch (e) {
    return new Error(e);
  }
}

async function getCommits(org, repo) {
  try {
    return await requestorTemplate.getAll(api.commits(org, repo));
  } catch (e) {
    return new Error(e);
  }
}

async function getIssues(org) {
  try {
    return await requestorTemplate.getAll(api.issues(org));
  } catch (e) {
    return new Error(e);
  }
}

async function getMembers(org) {
  try {
    return await requestorTemplate.getAll(api.members(org));
  } catch (e) {
    return new Error(e);
  }
}

async function getCommunityProfile(org, repo) {
  try {
    const response = await requestorTemplatePreview.get(api.communityProfile(org, repo));
    return response.body;
  } catch (e) {
    return new Error(e);
  }
}

function logger({ log = null } = {}) {
  const result = {};
  result.log = log
    || ((level, message, data) => {
      if (data.target) {
        console.log(`     ⬇️      Downloading ${data.target}`);
      }
    });

  return result;
}

module.exports = {
  getMembers,
  getIssues,
  getPullRequests,
  getCommits,
  getRepos,
  getOrgs,
  getOrgDetails,
  getCommunityProfile
};
