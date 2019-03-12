#!/usr/bin/env node
const GithubClient = require('./github/client.js');
const DatabaseClient = require('./database/client.js');
const Client = require('./client');
const ExportClient = require('./export/client.js');
const cliProgress = require('cli-progress');
const { performance } = require('perf_hooks');
const fs = require('fs');
const util = require('./util.js');
const dottie = require('dottie');
const localConfigPath = process.cwd() + '/roadblock.json';

async function init() {
  var localConfigExist = fs.existsSync(localConfigPath);
  if (localConfigExist) {
    console.log('  ✅   roadblock.json found - starting roadblock...');
    const localConfig = require(localConfigPath);
    const config = { ...util.defaultConfig, ...localConfig };

    //parse and override values from the commandline
    var arguments = process.argv.slice(2);
    for (const arg of arguments) {
      var keyval = arg.split('=');
      if (keyval.length > 1) {
        var val = keyval[1];
        if (val.indexOf('[') == 0 || val.indexOf('{') == 0) {
          val = JSON.parse(val);
        }
        dottie.set(config, keyval[0], val);
      }
    }

    return run(config);
  } else {
    return setup();
  }
}

async function setup() {
  console.log('  ℹ️   Creating roadblock.json configuration file');
  var json = JSON.stringify(util.minimalConfig, null, 4);
  fs.writeFileSync(localConfigPath, json, 'utf8');

  console.log(
    '  ✅   Default config created - update the configuration and re-run the roadblock command'
  );
  return true;
}

async function run(config) {
  var context = {};
  context.start = performance.now();
  context.github = new GithubClient(config.github.token, config.github.url);
  context.database = await new DatabaseClient(config.db).db();

  var scopes = await context.github.getScopes();
  var scopesValid = true;

  if (!scopes.indexOf('repo') < 0) {
    console.error(`  ⚠️  OAuth token does not have repo scope access`);
    scopesValid = false;
  }

  if (scopes.indexOf('read:org') < 0) {
    console.error(`  ⚠️  OAuth token does not have read:org scope access`);
    scopesValid = false;
  }

  if (!scopes.indexOf('read:user') < 0) {
    console.error(`  ⚠️  OAuth token does not have read:user scope access`);
    scopesValid = false;
  }

  if (!scopesValid) {
    throw 'Github auth token does not have the correct access scopes configured';
  }

  var externalClients = util.getClients().map(x => require(x));
  context.client = await Client(
    context.github,
    context.database,
    false,
    externalClients
  );
  context.exportClient = new ExportClient(context.database, config.export);

  // pre-process - setup calendar and orgs
  // these tasks have no org or repo passed to them.
  var pre_funcs = util.getTasks('pre', config.tasks).map(x => require(x));
  if (pre_funcs.length > 0) {
    console.log(`  ℹ️   Running ${pre_funcs.length} pre-processing tasks`);

    for (const task of pre_funcs) {
      var result = await task(context, config);
    }
  }

  var org_funcs = util.getTasks('org', config.tasks).map(x => require(x));
  if (org_funcs.length > 0) {
    // fetch all stored organisations to trigger tasks against...
    var orgs = await context.client.Organisation.model.findAll();

    console.log(
      `  ℹ️   Running ${org_funcs.length} organisation tasks on ${
        orgs.length
      } imported github organisations`
    );

    for (const org of orgs) {
      for (const orgTaskFunc of org_funcs) {
        var result = await orgTaskFunc(org, context, config);
      }
    }
  }

  var repo_funcs = util.getTasks('repo', config.tasks).map(x => require(x));
  if (repo_funcs.length > 0) {
    // Collect all stored repositories to run tasks against
    var repositories = await context.client.Repository.model.findAll({
      where: {
        fork: false
      }
    });

    if (repositories.length > 0) {
      console.log(
        `  ℹ️   Running ${repo_funcs.length} repository tasks on ${
          repositories.length
        } imported github repositories`
      );

      const repoProgress = new cliProgress.Bar(
        {},
        cliProgress.Presets.shades_classic
      );

      repoProgress.start(repositories.length, 0);

      // Do all reposiotory level tasks
      for (const repository of repositories) {
        var task_queue = [];
        context.externalValuesMap = { repository_id: repository.id };

        for (const repoTaskFunc of repo_funcs) {
          task_queue.push(repoTaskFunc(repository, context, config));
        }

        await Promise.all(task_queue);
        repoProgress.increment();
      }

      repoProgress.stop();
    } else {
      console.log('  ⚠️   No repositories downloaded');
    }
  }

  // Do all post-process / export tasks
  var post_funcs = util.getTasks('post', config.tasks).map(x => require(x));
  if (post_funcs.length > 0) {
    console.log(`  ℹ️   Running ${post_funcs.length} post-processing tasks`);
    for (const task of post_funcs) {
      await task(context, config);
    }
  }

  console.log(`  ℹ️   Roadblock processing complete`);
}

init();
