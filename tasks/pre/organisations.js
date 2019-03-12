var util = require('../../util.js');

module.exports = async function(context, config) {
  var orgs = await context.client.Organisation.getForUser();

  if (!orgs || !orgs.length) {
    orgs = [];
  }

  var orgsToQuery = orgs
    .map(x => x.login)
    .concat(config.orgs.filter(x => x !== '*'))
    .filter(util.uniqueFilter);

  for (let orgName of orgsToQuery) {
    if (util.runTask(orgName, config.orgs)) {
      console.log(`  ⬇️   Downloading ${orgName}`);

      var details = await context.client.Organisation.getDetails(orgName);
      if (!details instanceof Error) {
        details = await context.client.Organisation.saveOrUpdate(details);
      }
    }
  }

  return;
};
