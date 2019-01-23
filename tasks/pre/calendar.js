module.exports = async function(context) {
  var months = await context.client.Calendar.getAll(2014);
  await context.client.Calendar.bulkCreate(months);
  console.log(`  ⬇️    Calendar Database data stored`);
  return;
};
