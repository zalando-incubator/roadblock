const url = 'https://api.github.com';
const config = {
  api: {
    organisations: `${url}/user/orgs`,
    organisation: org => {
      return `${url}/orgs/${org}`;
    },
    repositories: org => {
      return `${url}/orgs/${org}/repos?type=public`;
    },
    repository: (org, repo) => {
      return `${url}/repos/${org}/${repo}`;
    },
    pullRequests: (owner, repo, state = 'all') => {
      return `${url}/repos/${owner}/${repo}/pulls?state=${state}`;
    },
    commits: (owner, repo) => {
      return `${url}/repos/${owner}/${repo}/commits`;
    },
    issues: (org, filter = 'all', state = 'all') => {
      return `${url}/orgs/${org}/issues?filter=${filter}&state=${state}`;
    },
    members: org => {
      return `${url}/orgs/${org}/members`;
    },
    communityProfile: (owner, name) => {
      return `${url}/repos/${owner}/${name}/community/profile`;
    },
    externalCollaboratorsForOrg: org => {
      return `${url}/orgs/${org}/outside_collaborators`;
    },
    collaborators: (org, repo) => {
      return `${url}/repos/${org}/${repo}/collaborators`;
    },
    contributorStatsForRepo: (org, repo) => {
      return `${url}/repos/${org}/${repo}/stats/contributors`;
    },
    contributorsForRepo: (org, repo) => {
      return `${url}/repos/${org}/${repo}/contributors`;
    },
    memberEvents: member => {
      return `${url}/users/${member}/events/public`;
    }
  },
  token: null
};

const setToken = value => {
  config.token = value;
};

export default {
  config,
  setToken
};
