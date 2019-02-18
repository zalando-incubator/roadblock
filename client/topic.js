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

  async destroy(id, where = { where: { repository_id: id } }) {
    try {
      return await this.dbClient.models.RepositoryTopic.destroy(where);
    } catch (ex) {
      console.write(this.name + ' truncating failed: ' + ex);
    }
  }

  async getAll(orgName, repoName) {
    var result = await this.ghClient.getTopics(orgName, repoName);

    if (result[0] && result[0].names) return result[0].names;

    return [];
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
    for (const topic of topics) {
      await this.saveOrUpdate(topic, repository);
    }
  }
};
