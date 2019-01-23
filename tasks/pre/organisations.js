var util = require('../../util.js');

module.exports = async function(context, config) {
  var orgs = await context.client.Organisation.getForUser();
  var orgsToQuery = orgs
    .map(x => x.login)
    .concat(config.orgs.filter(x => x !== '*'));

  for (let orgName of orgsToQuery) {
    if (util.runTask(orgName, config.orgs)) {
      console.log(`  ⬇️   Downloading ${orgName}`);

      var details = await context.client.Organisation.getDetails(orgName);
      details = await context.client.Organisation.saveOrUpdate(details);
    }
  }

  return;
};
