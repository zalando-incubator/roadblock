const ghrequestor = require('ghrequestor');

module.exports = class GithubClient {
  constructor(token, baseUrl = 'https://api.github.com') {
    this.token = token;
    this.url = baseUrl;

    this.api = {
      organisations: `${this.url}/user/orgs`,
      organisation: org => {
        return `${this.url}/orgs/${org}`;
      },
      repositories: org => {
        return `${this.url}/orgs/${org}/repos?type=public`;
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
    try {
      const response = await this.requestorTemplate.get(this.api.organisations);
      return response.body;
    } catch (e) {
      return new Error(e);
    }
  }

  async getRepos(org) {
    try {
      const response = await this.requestorTemplate.get(
        this.api.repositories(org)
      );
      return response.body;
    } catch (e) {
      return new Error(e);
    }
  }

  async getPullRequests(org, repo) {
    try {
      return await this.requestorTemplate.getAll(
        this.api.pullRequests(org, repo)
      );
    } catch (e) {
      return new Error(e);
    }
  }

  async getCommits(org, repo) {
    try {
      return await this.requestorTemplate.getAll(this.api.commits(org, repo));
    } catch (e) {
      return new Error(e);
    }
  }

  async getIssues(org) {
    try {
      return await this.requestorTemplate.getAll(this.api.issues(org));
    } catch (e) {
      return new Error(e);
    }
  }

  async getMembers(org) {
    try {
      return await this.requestorTemplate.getAll(this.api.members(org));
    } catch (e) {
      return new Error(e);
    }
  }

  async getCommunityProfile(org, repo) {
    try {
      const response = await requestorTemplatePreview.get(
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
    try {
      return await this.requestorTemplate.getAll(
        this.api.collaborators(org, repo)
      );
    } catch (e) {
      return new Error(e);
    }
  }

  async getContributions(org, repo) {
    try {
      return await this.requestorTemplate.getAll(
        this.api.contributorsForRepo(org, repo)
      );
    } catch (e) {
      return new Error(e);
    }
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

  async getMemberPushEvents(member) {
    try {
      const response = await requestorTemplatePreview.get(
        this.api.memberEvents(member)
      );
      return response.body;
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
          console.log(`     ⬇️      Downloading ${data.target}`);
        }
      });

    return result;
  }
};
