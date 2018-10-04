const Base = require('./base.js');
const Sequelize = require('sequelize');
const helper = require('./helper.js');

module.exports = class Issue extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      title: Sequelize.STRING(600),
      state: Sequelize.STRING,
      url: Sequelize.STRING(600),
      assignee_id: Sequelize.BIGINT,
      user_id: Sequelize.BIGINT,
      closed_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
      comments: Sequelize.INTEGER,
      created_at: Sequelize.DATE,
      pull_request: Sequelize.STRING(400),
      repository_id: Sequelize.BIGINT
    };

    this.map = {
      id: 'id',
      title: 'title',
      state: 'state',
      url: 'url',
      'assignee.id': 'assignee_id',
      'user.id': 'user_id',
      closed_at: 'closed_at',
      updated_at: 'updated_at',
      created_at: 'created_at',
      comments: 'comments',
      'repository.id': 'repository_id',
      'pull_request.html_url': 'pull_request'
    };

    this.name = 'Issue';
  }

  async getAll(orgName, repoName) {
    return await this.ghClient.getIssues(orgName, repoName);
  }

  async bulkCreate(issues) {
    const dbIssues = helper.mapArray(issues, this.map);
    await this.model.bulkCreate(dbIssues);
    return dbIssues;
  }
};
