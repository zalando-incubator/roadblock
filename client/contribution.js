const Base = require('./base.js');
const Sequelize = require('sequelize');
const helper = require('./helper.js');

module.exports = class Contribution extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      user_id: Sequelize.BIGINT,
      total: Sequelize.BIGINT,
      login: Sequelize.STRING(100)
    };

    this.map = {
      id: 'user_id',
      contributions: 'total',
      login: 'login'
    };

    this.name = 'Contribution';
  }

  sync(force) {
    this.model.belongsTo(this.dbClient.models.Repository);
    super.sync(force);
  }

  async getAll(orgName, repoName) {
    return await this.ghClient.getContributions(orgName, repoName);
  }

  async bulkCreate(contributions) {
    const dbContributions = helper.mapArray(contributions, this.map);
    await this.model.bulkCreate(dbContributions);
    return dbContributions;
  }
};
