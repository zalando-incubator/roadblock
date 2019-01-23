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

function mapArray(val, objmap, externalValues) {
  const arr = Array.isArray(val) ? val : [1].fill(val);

  return arr.map(x => {
    x = mapper(x, objmap);
    if (externalValues) {
      for (var p in externalValues) {
        if (externalValues.hasOwnProperty(p)) {
          x[p] = externalValues[p];
        }
      }
    }
    return x;
  });
}

module.exports = {
  updateOrCreate,
  mapArray
};
