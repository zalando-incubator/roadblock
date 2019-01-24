const Base = require('./base.js');
const Sequelize = require('sequelize');
const helper = require('./helper.js');

module.exports = class Calendar extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      date: Sequelize.DATE
    };

    this.name = 'Calendar';
  }

  sync(force) {
    super.sync(force);
  }

  async getAll(year = 2014) {
    var date = new Date(year, 0, 1);
    var end = new Date().getFullYear();

    var months = [];

    while (date.getFullYear() <= end) {
      months.push({ date: new Date(date.valueOf()) });
      date.setMonth(date.getMonth() + 1);
    }

    return months;
  }
};
