const Base = require('./base.js');
const Sequelize = require('sequelize');
const mapper = require('object-mapper');

module.exports = class Member extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      avatar: Sequelize.STRING(400),
      login: Sequelize.STRING(100),
      url: Sequelize.STRING
    };

    this.map = {
      id: 'id',
      avatar_url: 'avatar',
      html_url: 'url',
      login: 'login'
    };

    // this is still fairly lowlevel - if you need to instatiate this, the org client needs to be loaded
    // first, otherwise this will fail
    this.name = 'Member';
  }

  sync(force) {
    this.model.belongsToMany(this.dbClient.models.Organisation, {
      through: 'MemberOrganisation'
    });

    super.sync(force);
  }

  async getAll(orgName, logger) {
    return await this.ghClient.getMembers(orgName, logger);
  }

  async saveOrUpdate(member, organisation) {
    const dbMember = mapper(member, this.map);

    await this.model.findOrCreate({ where: dbMember }).spread(createdMember => {
      return organisation.addMember(createdMember);
    });
  }

  async bulkCreate(members, organisation) {
    for (const member of members) {
      await this.saveOrUpdate(member, organisation);
    }
  }
};
