const Base = require('./base.js');
const Sequelize = require('sequelize');
const helper = require('./helper.js');

module.exports = class Calendar extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      date: Sequelize.DATE
    };

    this.name = 'Calendar';
  }

  sync(force) {
    super.sync(force);

    var date = new Date(2014, 0, 1);
    var end = new Date().getFullYear();

    var months = [];

    while (date.getFullYear() <= end) {
      months.push({ date: new Date(date.valueOf()) });
      date.setMonth(date.getMonth() + 1);
    }

    this.model.bulkCreate(months);
  }
};
