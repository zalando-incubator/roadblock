const Base = require('./base.js');
const Sequelize = require('sequelize');
const helper = require('./helper.js');

module.exports = class Collaborator extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      user_id: Sequelize.BIGINT,
      avatar: Sequelize.STRING(400),
      login: Sequelize.STRING(100),
      url: Sequelize.STRING,
      pull: Sequelize.BOOLEAN,
      push: Sequelize.BOOLEAN,
      admin: Sequelize.BOOLEAN
    };

    this.map = {
      id: 'user_id',
      avatar_url: 'avatar',
      html_url: 'url',
      login: 'login',
      'permissions.push': 'push',
      'permissions.pull': 'pull',
      'permissions.admin': 'admin'
    };

    this.name = 'Collaborator';
  }

  sync(force) {
    this.model.belongsTo(this.dbClient.models.Repository);
    super.sync(force);
  }

  async getAll(orgName, repoName) {
    return await this.ghClient.getCollaborators(orgName, repoName);
  }

  async bulkCreate(collaborators, repoId) {
    const dbCollabs = helper.mapArray(collaborators, this.map);
    const dbCollaboratorsWithRepo = dbCollabs.map(x => {
      return {
        ...x,
        repository_id: repoId
      };
    });

    await this.model.bulkCreate(dbCollaboratorsWithRepo);
    return dbCollaboratorsWithRepo;
  }
};
