const Base = require('./base.js');
const Sequelize = require('sequelize');

module.exports = class Organisation extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      name: Sequelize.STRING(600),
      avatar: Sequelize.STRING,
      created_at: Sequelize.DATE,
      followers: Sequelize.INTEGER,
      following: Sequelize.INTEGER,
      collaborators: Sequelize.INTEGER,
      public_repositories: Sequelize.INTEGER,
      private_repositories: Sequelize.INTEGER,
      type: {
        type: Sequelize.STRING,
        defaultValue: 'internal'
      }
    };

    this.mapper = {
      id: 'id',
      login: 'name',
      avatar_url: 'avatar',
      created_at: 'created_at',
      follows: 'followers',
      following: 'following',
      collaborators: 'collaborators',
      total_private_repos: 'private_repositories',
      public_repos: 'public_repositories'
    };

    this.model = this.dbClient.define(
      'Organisation',
      this.schema,
      this.dbConfig
    );
  }

  async getAll() {
    return this.ghClient.getOrgs();
  }

  async getForUser() {}

  saveOrUpdate(org) {}
};
