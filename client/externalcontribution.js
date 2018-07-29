const Base = require('./base.js');
const Sequelize = require('sequelize');
const helper = require('./helper.js');

module.exports = class ExternalContribution extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      login: Sequelize.STRING,
      total: Sequelize.INTEGER,
      user_id: Sequelize.BIGINT,
      repository_name: Sequelize.STRING
    };

    this.map = {
      id: 'user_id',
      contributions: 'total',
      login: 'login'
    };

    this.name = 'ExternalContribution';
  }

  async getAndStore(config) {
    for (const target of config) {
      if (target.org && target.name) {
        await this.getAndStoreSingleRepo(target.org, target.name);
      } else if (target.org) {
        var orgRepos = await this.ghClient.getRepos(target.org);
        for (const repo of orgRepos) {
          await this.getAndStoreSingleRepo(target.org, repo.name);
        }
      }
    }
  }

  async getAndStoreSingleRepo(org, repo) {
    const contributions = await this.ghClient.getContributions(org, repo);
    const dbContribtutions = helper
      .mapArray(contributions, this.map)
      .map(contrib => {
        return {
          ...contrib,
          repository_name: repo
        };
      });

    await this.model.bulkCreate(dbContribtutions);
    return dbContribtutions;
  }

  async removeContributionsWithoutMembers() {
    await this.dbClient.query(`
          DELETE FROM ExternalContribution
          WHERE user_id IS NULL OR user_id NOT IN (
            SELECT id
            FROM Member
          )
        `);
  }
};
