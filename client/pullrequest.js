const Base = require('./base.js');
const Sequelize = require('sequelize');
const helper = require('./helper.js');

module.exports = class PullRequest extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      closed_at: Sequelize.DATE,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
      merged_at: Sequelize.DATE,
      url: Sequelize.STRING,
      title: Sequelize.STRING,
      state: Sequelize.STRING,
      pull_request_repository_id: Sequelize.BIGINT,
      author_association: Sequelize.STRING,
      assignee_id: Sequelize.BIGINT,
      user_id: Sequelize.BIGINT
    };

    this.map = {
      id: 'id',
      title: 'title',
      state: 'state',
      html_url: 'url',
      closed_at: 'closed_at',
      updated_at: 'updated_at',
      created_at: 'created_at',
      merged_at: 'merged_at',
      author_association: 'author_association',
      'assignee.id': 'assignee_id',
      'user.id': 'user_id',
      'base.repo.id': 'repository_id',
      'head.repo.id': 'pull_request_repository_id'
    };

    this.name = 'PullRequest';
  }

  sync(force) {
    this.model.belongsTo(this.dbClient.models.Repository);
    super.sync(force);
  }

  async getAll(orgName, repoName) {
    return await this.ghClient.getPullRequests(orgName, repoName);
  }

  async bulkCreate(pullrequests) {
    const dbPrs = helper.mapArray(pullrequests, this.map);
    await this.model.bulkCreate(dbPrs);
    return dbPrs;
  }
};
