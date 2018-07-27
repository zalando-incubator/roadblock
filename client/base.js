module.exports = class Base {
  constructor(githubClient, databaseClient) {
    this.ghClient = githubClient;
    this.dbClient = databaseClient;

    this.dbConfig = {
      underscored: true,
      timestamps: false,
      freezeTableName: true
    };
  }

  sync(force) {
    this.model.sync(force);
  }

  getSchema() {
    return this.schema;
  }

  getMapper() {
    return this.mapper;
  }

  getModel() {
    return this.mapper;
  }
};
