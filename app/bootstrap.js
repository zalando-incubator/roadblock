const fs = require('fs');
var path = require('path');
const { performance } = require('perf_hooks');

const dottie = require('dottie');

const GithubClient = require('../github/client.js');
const DatabaseClient = require('../database/client.js');
const Client = require('../client');
const ExportClient = require('../export/client.js');

const configs = require('./config');

module.exports = class Bootstrap {
  constructor(localDir = null, roadblockDir = null, args = new Array(0)) {
    if (!roadblockDir) roadblockDir = __dirname;

    if (!localDir) localDir = process.cwd();

    this.localConfig = localDir + '/roadblock.json';
    this.localDir = localDir;
    this.roadblockDir = roadblockDir;
    this.arguments = args;
    this.context = null;
  }

  localConfigExists() {
    return fs.existsSync(this.localConfig);
  }

  config() {
    if (!this.localConfigExists()) throw 'Roadblock configuration not found';

    const localConfig = require(this.localConfig);
    const config = { ...configs.defaultConfig, ...localConfig };

    for (const arg of this.arguments) {
      var keyval = arg.split('=');
      if (keyval.length > 1) {
        var val = keyval[1];
        if (val.indexOf('[') == 0 || val.indexOf('{') == 0) {
          val = JSON.parse(val);
        }
        dottie.set(config, keyval[0], val);
      }
    }

    return config;
  }

  async setupDirectory() {
    console.log('  ℹ️   Creating roadblock.json configuration file');
    var json = JSON.stringify(configs.minimalConfig, null, 4);
    fs.writeFileSync(this.localConfig, json, 'utf8');

    console.log(
      '  ✅   Default config created - update the configuration and re-run the roadblock command'
    );

    return true;
  }

  async getContext(config, forceRefresh = false) {
    if (!forceRefresh && this.context !== null) return this.context;

    var context = {};
    context.start = performance.now();

    context.github = new GithubClient(
      config.github.token,
      config.github.url.api
    );
    context.database = await new DatabaseClient(config.db).db();

    var externalClients = this._getClients().map(x => require(x));
    context.client = await Client(
      context.github,
      context.database,
      false,
      externalClients
    );

    context.exportClient = new ExportClient(context.database, config.export);
    context.ui = {};
    context.tasks = {};

    context.tasks.pre = this._getTasks('pre', config.tasks).map(x =>
      require(x)
    );
    context.tasks.org = this._getTasks('org', config.tasks).map(x =>
      require(x)
    );
    context.tasks.repo = this._getTasks('repo', config.tasks).map(x =>
      require(x)
    );
    context.tasks.post = this._getTasks('post', config.tasks).map(x =>
      require(x)
    );

    return context;
  }

  async validateScopes(context) {
    var scopes = await context.github.getScopes();
    var scopesValid = true;

    if (!(scopes.indexOf('repo') < 0)) {
      console.error(`  ⚠️  OAuth token does not have repo scope access`);
      scopesValid = false;
    }

    if (scopes.indexOf('read:org') < 0) {
      console.error(`  ⚠️  OAuth token does not have read:org scope access`);
      scopesValid = false;
    }

    if (!(scopes.indexOf('read:user') < 0)) {
      console.error(`  ⚠️  OAuth token does not have read:user scope access`);
      scopesValid = false;
    }

    if (!scopesValid) {
      throw 'Github auth token does not have the correct access scopes configured';
    }
  }

  _getTasks(dir, filter) {
    var tasks = [];
    var globalPath = this.roadblockDir + '/tasks/' + dir + '/';
    var localPath = this.localDir + '/' + dir + '/';

    var allowTask = function(filename) {
      var key = (dir + '/' + filename.replace('.js', '')).toLowerCase();

      if (filter.indexOf(`!${dir}/*`) > -1) return false;
      if (filter.indexOf(`!${key}`) > -1) return false;

      if (
        filter.indexOf('*') > -1 ||
        filter.indexOf(key) > -1 ||
        filter.indexOf(dir + '/*') > -1
      )
        return true;
    };

    if (fs.existsSync(globalPath)) {
      for (const file of fs.readdirSync(globalPath)) {
        if (allowTask(file)) tasks.push(globalPath + file);
      }
    }
    if (fs.existsSync(localPath)) {
      for (const file of fs.readdirSync(localPath)) {
        if (allowTask(file)) tasks.push(localPath + file);
      }
    }

    return tasks;
  }

  _getClients() {
    var tasks = [];
    var localPath = this.localDir + '/client/';

    if (fs.existsSync(localPath)) {
      for (const file of fs
        .readdirSync(localPath)
        .filter(x => path.extname(x) === '.js')) {
        tasks.push(localPath + file);
      }
    }

    return tasks;
  }
};
