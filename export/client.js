const Sequelize = require('sequelize');
const fs = require('fs');

function _getFileDate() {
  // get the short version of todays date for naming files
  var today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function saveToFile(data, folder, filename) {
  fs.writeFile(
    `${folder}${filename}.json`,
    JSON.stringify(data, null, 2),
    'utf8'
  );

  fs.writeFile(
    `${folder}${filename}-${_getFileDate()}.json`,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

module.exports = class ExportClient {
  constructor(database, config) {
    this.database = database;
    this.config = config;
  }

  async export() {
    // create a repo file listing the 100 most active projects
    var repos = await this.database.models.Repository.findAll({
      limit: 100,
      order: Sequelize.literal('(forks+stars+watchers) DESC')
    });
    repos = repos.map(x => {
      return x.dataValues;
    });
    saveToFile(repos, this.config.storage, 'repositories');

    // organisation stats
    var orgs = await this.database.models.Organisation.findAll();
    orgs = orgs.map(x => {
      return x.dataValues;
    });
    saveToFile(orgs, this.config.storage, 'organisations');

    // general statistics
    var stats = {};
    stats.stars = await this.database.models.Repository.sum('stars');
    stats.projects = await this.database.models.Repository.count();
    stats.languages = await this.database.models.Repository.count({
      col: 'language',
      distinct: true
    });
    stats.forks = await this.database.models.Repository.sum('forks');
    stats.members = await this.database.models.Member.count();
    stats.contributors = await this.database.models.Contribution.count({
      col: 'user_id',
      distinct: true
    });

    saveToFile(stats, this.config.storage, 'statistics');
  }
};
