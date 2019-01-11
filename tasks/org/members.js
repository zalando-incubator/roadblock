var util = require('../../util.js');

module.exports = async function(org, context, config) {
  // Get all members in the org and save them
  console.log(`  ⬇️   Downloading ${org.login} members`);
  var membersInOrg = await context.client.Member.getAll(
    org.login,
    util.barlogger()
  );

  console.log(`  ✅   Saving ${membersInOrg.length} ${org.login} members`);
  await context.client.Member.bulkCreate(membersInOrg, org);

  util.timePassed(context.start);
  return;
};
