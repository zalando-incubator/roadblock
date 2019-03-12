module.exports = async function(context, config) {
  console.log(
    `  💾   Exporting statistics as json to ${
      context.exportClient.config.storage
    }`
  );

  // Finally when everything has been saved to the Database,
  // extract json files with the full dataset
  context.exportClient.export();
  return true;
};
