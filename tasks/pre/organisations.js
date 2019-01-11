var util = require('../../util.js');

module.exports = async function(context, config) {
  var orgs = await context.client.Organisation.getForUser();

  for (let org of orgs) {
    if (util.runTask(org.login, config.orgs)) {
      console.log(` ⬇️  Downloading ${org.login}`);

      org = await context.client.Organisation.getDetails(org.login);
      org = await context.client.Organisation.saveOrUpdate(org);
    }
  }

  return;
};
