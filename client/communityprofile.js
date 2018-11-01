const Base = require('./base.js');
const Sequelize = require('sequelize');
const helper = require('./helper.js');

module.exports = class CommunityProfile extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      health_percentage: Sequelize.INTEGER,
      description: Sequelize.STRING,
      documentation: Sequelize.STRING,
      code_of_conduct: Sequelize.BOOLEAN,
      contributing: Sequelize.BOOLEAN,
      issue_template: Sequelize.BOOLEAN,
      pull_request_template: Sequelize.BOOLEAN,
      readme: Sequelize.BOOLEAN,
      license: Sequelize.STRING
    };

    this.map = {
      id: 'id',
      health_percentage: 'health_percentage',
      description: 'description',
      documentation: 'documentation',
      'files.code_of_conduct': {
        key: 'code_of_conduct',
        transform: file => {
          return file ? true : false;
        }
      },
      'files.contributing': {
        key: 'contributing',
        transform: file => {
          return file ? true : false;
        }
      },
      'files.issue_template': {
        key: 'issue_template',
        transform: file => {
          return file ? true : false;
        }
      },
      'files.pull_request_template': {
        key: 'pull_request_template',
        transform: file => {
          return file ? true : false;
        }
      },
      'files.readme': {
        key: 'readme',
        transform: file => {
          return file ? true : false;
        }
      },
      'files.license': {
        key: 'license',
        transform: file => {
          return file ? file.name : '';
        }
      }
    };

    this.name = 'CommunityProfile';
  }

  sync(force) {
    this.model.belongsTo(this.dbClient.models.Repository);
    super.sync(force);
  }

  async getAll(orgName, repoName) {
    return await this.ghClient.getCommunityProfile(orgName, repoName);
  }

  async bulkCreate(communityProfiles) {
    const dbCommunityProfiles = helper.mapArray(communityProfiles, this.map);
    await this.model.bulkCreate(dbCommunityProfiles);
    return dbCommunityProfiles;
  }
};
