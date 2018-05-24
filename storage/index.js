const Sequelize = require('sequelize');
const config = require('./config');
const schema = require('./schema');

const dbCfg = config.sequalize;
const sequelize = new Sequelize(
  dbCfg.database,
  dbCfg.username,
  dbCfg.password,
  {
    host: 'localhost',
    dialect: dbCfg.dialect,
    operatorsAliases: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    storage: dbCfg.storage,
    logging: (message, data) => {
      if (data && data.type === 'INSERT') {
        message = `Saving data to table: ${data.model.name} `;

        if (data && data.instance && data.instance.dataValues) {
          const dv = data.instance.dataValues;
          if (dv.name) message += dv.name;
          if (dv.login) message += dv.login;
          if (dv.title) message += dv.title;
        }
        console.log(`     💾      ${message} `);
      }
    }
  }
);

// models defined from the database schema
const _models = {};
const _modelCfg = {
  underscored: true,
  timestamps: false,
  freezeTableName: true
};

var syncSchema = async function(force) {
  await _models.Organisation.sync({ force });
  await _models.Repository.sync({ force });
  await _models.PullRequest.sync({ force });
  await _models.Issue.sync({ force });
  await _models.Member.sync({ force });
  await _models.Commit.sync({ force });
  await _models.CommunityProfile.sync({ force });
  await _models.Collaborator.sync({ force });
  await _models.ExternalContribution.sync({ force });

  console.log('Schema sync complete.');
};

const connect = async function() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    _models.Organisation = sequelize.define('Organisation', schema.Organisation, _modelCfg);
    _models.Issue = sequelize.define('Issue', schema.Issue, _modelCfg);
    _models.Member = sequelize.define('Member', schema.Member, _modelCfg);
    _models.Repository = sequelize.define('Repository', schema.Repository, _modelCfg);
    _models.PullRequest = sequelize.define('PullRequest', schema.PullRequest, _modelCfg);
    _models.Commit = sequelize.define('Commit', schema.Commit, _modelCfg);
    _models.Collaborator = sequelize.define('Collaborator', schema.Collaborator, _modelCfg);
    _models.ExternalContribution = sequelize.define(
      'ExternalContribution',
      schema.ExternalContribution,
      _modelCfg
    );
    _models.CommunityProfile = sequelize.define(
      'CommunityProfile',
      schema.CommunityProfile,
      _modelCfg
    );

    _models.Repository.belongsTo(_models.Organisation);
    _models.PullRequest.belongsTo(_models.Repository);
    _models.Issue.belongsTo(_models.Repository);
    _models.Commit.belongsTo(_models.Repository);
    _models.CommunityProfile.belongsTo(_models.Repository);
    _models.ExternalContribution.belongsTo(_models.Member);

    _models.Member.belongsToMany(_models.Organisation, { through: 'MemberOrganisation' });
    _models.Organisation.belongsToMany(_models.Member, { through: 'MemberOrganisation' });

    _models.Collaborator.belongsToMany(_models.Repository, { through: 'CollaboratorRepository' });
    _models.Repository.belongsToMany(_models.Collaborator, { through: 'CollaboratorRepository' });

    sequelize.sync();

    return _models;
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  connect,
  syncSchema
};
