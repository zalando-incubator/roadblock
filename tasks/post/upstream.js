module.exports = async function(context, config) {
  if (config.github.url === 'https://api.github.com') {
    console.log(
      ' ⬇️  Downloading external contribution data from external repositories'
    );

    // Get all our external projects which we might contribute to
    await context.client.ExternalContribution.getAndStore(
      config.externalProjects
    );

    // Clean up external contributions so it is only those that fit our members
    await context.client.ExternalContribution.removeContributionsWithoutMembers();
  }

  return;
};
