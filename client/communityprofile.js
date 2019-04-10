const Base = require('./base.js');
const Sequelize = require('sequelize');
const helper = require('./helper.js');
const rp = require('request-promise');
const yaml = require('js-yaml');

module.exports = class CommunityProfile extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      health_percentage: Sequelize.INTEGER,
      description: Sequelize.STRING,
      documentation: Sequelize.STRING,
      code_of_conduct: Sequelize.BOOLEAN,
      contributing: Sequelize.BOOLEAN,
      issue_template: Sequelize.BOOLEAN,
      pull_request_template: Sequelize.BOOLEAN,
      readme: Sequelize.BOOLEAN,
      license: Sequelize.STRING,
      contributing_file: Sequelize.BOOLEAN,
      security_file: Sequelize.BOOLEAN,
      codeowners_file: Sequelize.BOOLEAN,
      maintainers_file: Sequelize.BOOLEAN,

      zappr_file: Sequelize.BOOLEAN,
      zappr_status_check: Sequelize.BOOLEAN,
      zappr_webhook_active: Sequelize.BOOLEAN,
      zappr_team: Sequelize.STRING,
      zappr_type: Sequelize.STRING,

      required_reviewers: Sequelize.BOOLEAN,
      require_codeowners: Sequelize.BOOLEAN,
      protected_master: Sequelize.BOOLEAN,
      enforce_admins: Sequelize.BOOLEAN
    };

    this.map = {
      id: 'id',
      'community.health_percentage': 'health_percentage',
      'community.description': 'description',
      'community.documentation': 'documentation',
      'community.repository_id': 'repository_id',
      'community.files.code_of_conduct': {
        key: 'code_of_conduct',
        transform: file => {
          return file ? true : false;
        }
      },
      'community.files.contributing': {
        key: 'contributing',
        transform: file => {
          return file ? true : false;
        }
      },
      'community.files.issue_template': {
        key: 'issue_template',
        transform: file => {
          return file ? true : false;
        }
      },
      'community.files.pull_request_template': {
        key: 'pull_request_template',
        transform: file => {
          return file ? true : false;
        }
      },
      'community.files.readme': {
        key: 'readme',
        transform: file => {
          return file ? true : false;
        }
      },
      'community.files.license': {
        key: 'license',
        transform: file => {
          return file ? file.name : '';
        }
      },

      'branchProtection.required_pull_request_reviews.required_approving_review_count':
        'required_reviewers',
      'branchProtection.required_pull_request_reviews.require_code_owner_reviews':
        'require_codeowners',
      'branchProtection.enforce_admins.enabled': 'enforce_admins',

      branchProtection: {
        key: 'protected_master',
        transform: protection => {
          return protection ? true : false;
        }
      },

      'branchProtection.required_status_checks': {
        key: 'zappr_status_check',
        transform: checks => {
          if (!checks || !checks.contexts) return false;

          return checks.contexts.indexOf('zappr') >= 0;
        }
      },

      'files.security': 'security_file',
      'files.contributing': 'contributing_file',
      'files.codeowners': 'codeowners_file',
      'files.maintainers': 'maintainers_file',

      'zappr.active': 'zappr_webhook_active',
      'zappr.fill': 'zappr_file',
      'zappr.type': 'zappr_type',
      'zappr.team': 'zappr_team'
    };

    this.name = 'CommunityProfile';
  }

  sync(force) {
    this.model.belongsTo(this.dbClient.models.Repository);
    super.sync(force);
  }

  async urlExists(url) {
    const options = {
      uri: url,
      resolveWithFullResponse: true
    };

    try {
      const res = await rp(options);
      return /^(?!4)\d\d/.test(res.statusCode);
    } catch (err) {
      return false;
    }
  }

  async getUrl(url) {
    const options = {
      uri: url,
      resolveWithFullResponse: true
    };

    try {
      const res = await rp(options);
      return res.body;
    } catch (err) {
      return null;
    }
  }

  async getAll(orgName, repoName) {
    var community = await this.ghClient.getCommunityProfile(orgName, repoName);

    var hooks = await this.ghClient.getHooks(orgName, repoName);
    var zapprHook = hooks.filter(
      x =>
        x.config &&
        x.config.url &&
        x.config.url.toLowerCase() ===
          'https://zappr.opensource.zalan.do/api/hook'
    );

    var filesBaseUrl =
      'https://raw.githubusercontent.com/' +
      orgName +
      '/' +
      repoName +
      '/master/';

    var zappr = {
      found: false,
      file: false
    };

    var zapprFile = await this.getUrl(filesBaseUrl + '.zappr.yaml');
    if (zapprFile) {
      try {
        var doc = yaml.safeLoad(zapprFile);
        zappr.file = true;

        if (doc.hasOwnProperty('X-Zalando-Team')) {
          zappr.team = doc['X-Zalando-Team'];
        }

        if (doc.hasOwnProperty('X-Zalando-Type')) {
          zappr.type = doc['X-Zalando-Type'];
        }
      } catch (ex) {
        console.log(ex);
      }
    }
    if (zapprHook && zapprHook.length > 0) {
      zappr.found = true;
      zappr.url = zapprHook[0].config.url;
      zappr.active = zapprHook[0].active;
    }

    var branchProtection = await this.ghClient.getBranchProtection(
      orgName,
      repoName,
      'master'
    );

    var files = {};
    files.zappr = await this.urlExists(filesBaseUrl + '.zappr.yaml');

    files.contributing = await this.urlExists(filesBaseUrl + 'CONTRUBUTING.md');
    if (!files.contributing) {
      files.contributing = await this.urlExists(
        filesBaseUrl + 'CONTRUBUTING.rst'
      );
    }

    files.security = await this.urlExists(filesBaseUrl + 'SECURITY.md');
    if (!files.security) {
      files.security = await this.urlExists(filesBaseUrl + 'SECURITY.rst');
    }

    files.codeowners = await this.urlExists(
      filesBaseUrl + '.github/CODEOWNERS'
    );

    files.maintainers = await this.urlExists(filesBaseUrl + 'MAINTAINERS');

    return {
      community,
      branchProtection,
      files,
      zappr
    };
  }
};
