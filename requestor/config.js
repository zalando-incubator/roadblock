const url = 'https://api.github.com';
const config = {
  api: {
    organisations: `${url}/user/orgs`,
    organisation: org => {
      return `${url}/orgs/${org}`;
    },
    repositories: org => {
      return `${url}/orgs/${org}/repos`;
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
    }
  },
  token: null
};

const setToken = (value) => {
  config.token = value;
};

module.exports = {
  config,
  setToken
};
