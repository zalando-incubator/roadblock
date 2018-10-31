const Base = require('./base.js');
const Sequelize = require('sequelize');

module.exports = class Topic extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      topic: Sequelize.STRING
    };
    this.name = 'Topic';
  }

  sync(force) {
    this.model.belongsToMany(this.dbClient.models.Repository, {
      through: 'RepositoryTopic'
    });

    super.sync(force);
  }

  async getAll(orgName, repoName) {
    return await this.ghClient.getTopics(orgName, repoName);
  }

  async saveOrUpdate(topicName, repository) {
    const t = { topic: topicName };

    try {
      await this.model
        .findOrCreate({ where: { topic: topicName } })
        .spread(createdTopic => {
          return repository.addTopic(createdTopic);
        });
    } catch (ex) {
      console.log(ex);
    }
  }

  async bulkCreate(topics, repository) {
    if (topics[0] && topics[0].names) {
      for (const topic of topics[0].names) {
        await this.saveOrUpdate(topic, repository);
      }
    }
  }
};
