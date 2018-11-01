const Sequelize = require('sequelize');

module.exports = class DatabaseClient {
  constructor(config) {
    this.sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: 'localhost',
        dialect: config.dialect,
        operatorsAliases: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        storage: config.storage,

        logging: (message, data) => {
          if (data && data.type === 'INSERT') {
            message = `Saving data to table: ${data.model.name} `;

            if (data && data.instance && data.instance.dataValues) {
              const dv = data.instance.dataValues;
              if (dv.name) message += dv.name;
              if (dv.login) message += dv.login;
              if (dv.title) message += dv.title;
            }
          }
        }
      }
    );
  }

  async db() {
    await this.sequelize.authenticate();
    return this.sequelize;
  }
};
