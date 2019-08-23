#!/usr/bin/env node
const cliProgress = require('cli-progress');
const Bootstrap = require('./app/bootstrap.js');

var app;

async function init() {
  var args = process.argv.slice(2);
  app = new Bootstrap(process.cwd(), __dirname, args);

  if (app.localConfigExists()) {
    console.log('  ✅   roadblock.json found - starting roadblock...');
    const config = app.config();
    const context = await app.getContext(config);

    return run(config, context);
  } else {
    return await app.setupDirectory();
  }
}

async function run(config, context) {
  await app.validateScopes(context);

  // pre-process - setup calendar and orgs
  // these tasks have no org or repo passed to them.
  if (context.tasks.pre.length > 0) {
    console.log(
      `  ℹ️   Running ${context.tasks.pre.length} pre-processing tasks`
    );

    for (const task of context.tasks.pre) {
      var result = await task(context, config);
    }
  }

  if (context.tasks.org.length > 0) {
    // fetch all stored organisations to trigger tasks against...
    var orgs = await context.client.Organisation.model.findAll();

    console.log(
      `  ℹ️   Running ${context.tasks.org.length} organisation tasks on ${
        orgs.length
      } imported github organisations`
    );

    for (const org of orgs) {
      for (const orgTaskFunc of context.tasks.org) {
        var result = await orgTaskFunc(org, context, config);
      }
    }
  }

  if (context.tasks.repo.length > 0) {
    // Collect all stored repositories to run tasks against
    var repositories = await context.client.Repository.model.findAll({
      where: {
        fork: false
      }
    });

    if (repositories.length > 0) {
      console.log(
        `  ℹ️   Running ${context.tasks.repo.length} repository tasks on ${
          repositories.length
        } imported github repositories`
      );

      const repoProgress = new cliProgress.Bar(
        {
          format:
            'progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | {state}'
        },
        cliProgress.Presets.shades_classic
      );
      context.ui.bar = repoProgress;
      repoProgress.start(repositories.length, 0);

      // Do all reposiotory level tasks
      for (const repository of repositories) {
        var task_queue = [];
        context.externalValuesMap = { repository_id: repository.id };

        for (const repoTaskFunc of context.tasks.repo) {
          task_queue.push(repoTaskFunc(repository, context, config));
        }

        await Promise.all(task_queue);
        repoProgress.increment(1);
      }

      repoProgress.stop();
    } else {
      console.log('  ⚠️   No repositories downloaded');
    }
  }

  // Do all post-process / export tasks

  if (context.tasks.post.length > 0) {
    console.log(
      `  ℹ️   Running ${context.tasks.post.length} post-processing tasks`
    );
    for (const task of context.tasks.post) {
      await task(context, config);
    }
  }

  console.log(`  ℹ️   Roadblock processing complete`);
}

init();
