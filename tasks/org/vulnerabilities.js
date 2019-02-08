var util = require('../../util.js');

module.exports = async function(org, context, config) {
  console.log(`  ⬇️   Downloading ${org.login} vulnerability alerts`);

  // Get all repositories in the org and save them
  var alerts = await context.client.Vulnerability.getAll(org.login);
  for (const repo of alerts) {
    var int_id = Buffer.from(repo.id, 'base64')
      .toString('ascii')
      .split('Repository')[1];
    var vulns = repo.vulnerabilityAlerts.edges;

    if (vulns.length > 0) {
      await context.client.Vulnerability.bulkCreate(vulns.map(x => x.node), {
        repository_id: int_id
      });
    }
  }
  console.log(`  ✅   Saving ${org.login} alerts`);
  util.timePassed(context.start);

  return;
};
