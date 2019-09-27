const Base = require('./base.js');
const Sequelize = require('sequelize');
const mapper = require('object-mapper');
const helper = require('./helper.js');

module.exports = class Repository extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      name: Sequelize.STRING,
      owner: Sequelize.STRING,
      description: Sequelize.STRING,
      full_name: Sequelize.STRING,
      language: Sequelize.STRING,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
      stars: Sequelize.INTEGER,
      forks: Sequelize.INTEGER,
      size: Sequelize.INTEGER,
      open_issues: Sequelize.INTEGER,
      watchers: Sequelize.INTEGER,
      type: {
        type: Sequelize.STRING,
        defaultValue: 'internal'
      },
      fork: Sequelize.BOOLEAN,
      archived: Sequelize.BOOLEAN,
      team_id: Sequelize.STRING
    };

    this.map = {
      id: 'id',
      name: 'name',
      description: 'description',
      'owner.login': 'owner',
      full_name: 'full_name',
      language: 'language',
      created_at: 'created_at',
      updated_at: 'updated_at',
      forks_count: 'forks',
      size: 'size',
      stargazers_count: 'stars',
      open_issues_count: 'open_issues',
      watchers_count: 'watchers',

      fork: 'fork',
      archived: 'archived',
      team_id: 'team_id'
    };

    this.name = 'Repository';
  }

  sync(force) {
    //this.model.belongsTo(this.dbClient.models.Organisation);
    this.model.hasMany(this.dbClient.models.Release);
    this.model.hasMany(this.dbClient.models.Contribution);

    this.model.belongsToMany(this.dbClient.models.Topic, {
      through: 'RepositoryTopic'
    });

    this.model.belongsTo(this.dbClient.models.Organisation);

    super.sync(force);
  }

  async getAll(orgName) {
    return await this.ghClient.getRepos(orgName);
  }

  async getRepo(orgName, repo) {
    return await this.ghClient.getRepo(orgName, repo);
  }

  async bulkCreate(repos, organisation) {
    for (const repo of repos) {
      const dbrepo = mapper(repo, this.map);
      dbrepo.organisation_id = organisation.id;

      await this.model.upsert(dbrepo);
    }
  }
};
