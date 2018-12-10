const helper = require('./helper.js');
const mapper = require('object-mapper');

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

  async bulkCreate(valArray, externalValues) {
    const dbValArray = this.map
      ? helper.mapArray(valArray, this.map, externalValues)
      : valArray;
    await this.model.bulkCreate(dbValArray);
    return dbValArray;
  }

  async saveOrUpdate(value) {
    const dbValue = mapper(value, this.map);
    await this.model.upsert(dbValue);
    return dbValue;
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
