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

  // Defines the model and schema in the sequelize singleton
  define() {
    this.model = this.dbClient.define(this.name, this.schema, this.dbConfig);
  }

  // syncs the schema and any of the intertable relations
  sync(force) {
    this.model.sync(force);
  }

  // generic delete statement
  async destroy(where) {
    return await this.model.destroy(where);
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
