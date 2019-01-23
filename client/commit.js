const Base = require('./base.js');
const Sequelize = require('sequelize');
const helper = require('./helper.js');

module.exports = class Commit extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      author: Sequelize.BIGINT,
      author_date: Sequelize.DATE,
      committer: Sequelize.BIGINT,
      committer_date: Sequelize.DATE,
      url: Sequelize.STRING,
      message: Sequelize.STRING,
      comment_count: Sequelize.INTEGER
    };

    this.map = {
      id: 'id',
      'commit.message': 'message',
      'author.id': 'author',
      'commit.author.date': 'author_date',
      'committer.id': 'committer',
      'commit.committer.date': 'committer_date',
      html_url: 'url',
      'commit.comment_count': 'comment_count'
    };

    this.name = 'Commit';
  }

  sync(force) {
    this.model.belongsTo(this.dbClient.models.Repository);
    super.sync(force);
  }

  async getAll(orgName, repoName) {
    return await this.ghClient.getCommits(orgName, repoName);
  }
};
