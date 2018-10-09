const ghrequestor = require('ghrequestor');
const cliProgress = require('cli-progress');

module.exports = class GithubClient {
  constructor(token, baseUrl = 'https://api.github.com') {
    this.token = token;
    this.url = baseUrl;

    this.api = {
      organisations: `${this.url}/organizations`,
      userOrganisations: `${this.url}/user/orgs`,
      organisation: org => {
        return `${this.url}/orgs/${org}`;
      },

      repositories: org => {
        return `${this.url}/orgs/${org}/repos?type=sources`;
      },

      repository: (org, repo) => {
        return `${this.url}/repos/${org}/${repo}`;
      },
      pullRequests: (owner, repo, state = 'all') => {
        return `${this.url}/repos/${owner}/${repo}/pulls?state=${state}`;
      },
      commits: (owner, repo) => {
        return `${this.url}/repos/${owner}/${repo}/commits`;
      },
      issues: (org, filter = 'all', state = 'all') => {
        return `${this.url}/orgs/${org}/issues?filter=${filter}&state=${state}`;
      },
      members: org => {
        return `${this.url}/orgs/${org}/members`;
      },
      communityProfile: (owner, name) => {
        return `${this.url}/repos/${owner}/${name}/community/profile`;
      },
      externalCollaboratorsForOrg: org => {
        return `${this.url}/orgs/${org}/outside_collaborators`;
      },
      collaborators: (org, repo) => {
        return `${this.url}/repos/${org}/${repo}/collaborators`;
      },
      contributorStatsForRepo: (org, repo) => {
        return `${this.url}/repos/${org}/${repo}/stats/contributors`;
      },
      contributorsForRepo: (org, repo) => {
        return `${this.url}/repos/${org}/${repo}/contributors`;
      },
      memberEvents: member => {
        return `${this.url}/users/${member}/events/public`;
      }
    };

    this.headers = { authorization: `token ${token}` };
    this.requestorTemplate = ghrequestor.defaults({
      headers: this.headers,
      logger: this.logger()
    });

    this.previewHeaders = {
      ...this.headers,
      accept: 'application/vnd.github.black-panther-preview+json'
    };
    this.requestorTemplatePreview = ghrequestor.defaults({
      headers: this.previewHeaders,
      logger: this.logger()
    });
  }

  getBaseUrl() {
    return this.url;
  }

  async getOrgDetails(org) {
    try {
      const response = await this.requestorTemplate.get(
        this.api.organisation(org)
      );
      return response.body;
    } catch (e) {
      return new Error(e);
    }
  }

  async getOrgs() {
    const response = await this.requestorTemplate.get(this.api.organisations);
    return response.body;
  }

  async getOrgsForUser() {
    const response = await this.requestorTemplate.get(
      this.api.userOrganisations
    );
    return response.body;
  }

  async getRepos(org) {
    const response = await this.requestorTemplate.get(
      this.api.repositories(org)
    );
    return response.body;
  }

  async getPullRequests(org, repo) {
    return await this.requestorTemplate.getAll(
      this.api.pullRequests(org, repo)
    );
  }

  async getCommits(org, repo) {
    return await this.requestorTemplate.getAll(this.api.commits(org, repo));
  }

  async getIssues(org, logger = null) {
    var template = !logger
      ? requestorTemplate
      : ghrequestor.defaults({
          headers: this.headers,
          logger: logger
        });

    return await template.getAll(this.api.issues(org));
  }

  async getMembers(org, logger = null) {
    var template = !logger
      ? requestorTemplate
      : ghrequestor.defaults({
          headers: this.headers,
          logger: logger
        });

    return await template.getAll(this.api.members(org));
  }

  async getCommunityProfile(org, repo) {
    try {
      const response = await this.requestorTemplatePreview.get(
        this.api.communityProfile(org, repo)
      );
      return response.body;
    } catch (e) {
      return new Error(e);
    }
  }

  async getExternalCollaboratorsForOrg(org) {
    try {
      return await this.requestorTemplate.getAll(
        this.api.externalCollaboratorsForOrg(org)
      );
    } catch (e) {
      return new Error(e);
    }
  }

  async getCollaborators(org, repo) {
    return await this.requestorTemplate.getAll(
      this.api.collaborators(org, repo)
    );
  }

  async getContributions(org, repo) {
    return await this.requestorTemplate.getAll(
      this.api.contributorsForRepo(org, repo)
    );
  }

  async getExternalContributions(org, repo) {
    try {
      return await this.requestorTemplate.getAll(
        this.api.contributorsForRepo(org, repo)
      );
    } catch (e) {
      return new Error(e);
    }
  }

  logger({ log = null } = {}) {
    const result = {};
    result.log =
      log ||
      ((level, message, data) => {
        if (data.target) {
          //console.log(`     ⬇️      Downloading ${data.target}`);
        }
      });

    return result;
  }
};
