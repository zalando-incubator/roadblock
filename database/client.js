const Sequelize = require('sequelize');

module.exports = class DatabaseClient {
  constructor(config) {
    this.sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        dialect: config.dialect,
        operatorsAliases: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        storage: config.storage
      }
    );
  }

  async db() {
    await this.sequelize.authenticate();
    return this.sequelize;
  }
};
