const Base = require('./base.js');
const Sequelize = require('sequelize');

const simpleGit = require('simple-git')();
const fs = require('fs');
const path = require('path');

const gitPromise = require('simple-git/promise');
const gitGuilt = require('git-guilt');

var mkdir = function(dir) {
  // making directory without exception if exists
  try {
    fs.mkdirSync(dir, 0755);
  } catch (e) {
    if (e.code != 'EEXIST') {
      throw e;
    }
  }
};

var rmdir = function(dir) {
  if (fs.existsSync(dir)) {
    var list = fs.readdirSync(dir);
    for (var i = 0; i < list.length; i++) {
      var filename = path.join(dir, list[i]);
      var stat = fs.statSync(filename);

      if (filename == '.' || filename == '..') {
        // pass these files
      } else if (stat.isDirectory()) {
        // rmdir recursively
        rmdir(filename);
      } else {
        // rm fiilename
        fs.unlinkSync(filename);
      }
    }
    fs.rmdirSync(dir);
  } else {
    console.warn('warn: ' + dir + ' not exists');
  }
};

module.exports = class Blame extends Base {
  constructor(githubClient, databaseClient) {
    super(githubClient, databaseClient);

    this.schema = {
      total: Sequelize.BIGINT,
      login: Sequelize.STRING(200)
    };

    this.map = {
      total: 'total',
      login: 'login'
    };

    this.name = 'Blame';
  }

  sync(force) {
    this.model.belongsTo(this.dbClient.models.Repository);
    super.sync(force);
  }

  async getAll(orgName, repoName) {
    var folder = __dirname + '/tmp-repo-data';
    mkdir(folder);

    const remote = `https://github.com/${orgName}/${repoName}.git`;
    const git = gitPromise(folder);

    try {
      await git.silent(true).clone(remote);
    } catch (ex) {
      console.log(orgName + '/' + repoName + ': ' + ex);
    }

    try {
      var blame = await gitGuilt({ repoPath: folder + '/' + repoName });

      rmdir(folder + '/' + repoName);

      var sum = Object.values(blame).reduce((a, b) => a + b, 0);
      return Object.keys(blame).map(x => {
        var prct = blame[x];
        if (prct > 0) {
          prct = (prct / sum) * 100;
        }
        return { login: x, total: prct };
      });
    } catch (ex) {
      console.log(orgName + '/' + repoName + ': ' + ex);
    }

    return [];
  }
};
