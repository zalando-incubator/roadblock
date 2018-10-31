const mapper = require('object-mapper');

async function updateOrCreate(model, where, newItem) {
  // First try to find the record
  var foundItem = await model.findOne({ where: where });

  if (!foundItem) {
    // Item not found, create a new one
    var c = await model.create(newItem);
    return c;
  }

  // Found an item, update it - for now return the found item,,,
  await model.update(newItem, { where: where });
  return foundItem;
}

function mapArray(val, objmap) {
  const arr = Array.isArray(val) ? val : [1].fill(val);

  return arr.map(x => {
    return mapper(x, objmap);
  });
}

module.exports = {
  updateOrCreate,
  mapArray
};
