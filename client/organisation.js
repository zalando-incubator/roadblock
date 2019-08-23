const Base = require('./base.js');
const Sequelize = require('sequelize');
const mapper = require('object-mapper');
const helper = require('./helper.js');

module.exports = class Organisation extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      name: Sequelize.STRING(300),
      login: Sequelize.STRING(300),
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

    this.map = {
      id: 'id',
      login: 'login',
      name: 'name',
      avatar_url: 'avatar',
      created_at: 'created_at',
      followers: 'followers',
      following: 'following',
      collaborators: 'collaborators',
      total_private_repos: 'private_repositories',
      public_repos: 'public_repositories'
    };

    this.name = 'Organisation';
  }

  sync(force) {
    this.model.belongsToMany(this.dbClient.models.Member, {
      through: 'MemberOrganisation'
    });

    this.model.hasMany(this.dbClient.models.Repository, { as: 'Repositories' });
    super.sync(force);
  }

  async getAll() {
    return await this.ghClient.getOrgs();
  }

  async getDetails(orgName) {
    return await this.ghClient.getOrgDetails(orgName);
  }

  async getOrg(orgName) {
    return await this.ghClient.getOrg(orgName);
  }

  async getForUser() {
    return await this.ghClient.getOrgsForUser();
  }

  async saveOrUpdate(org) {
    const dbOrg = mapper(org, this.map);
    return await helper.updateOrCreate(this.model, { id: dbOrg.id }, dbOrg);
  }
};
