var _ = require('lodash');

module.exports = Scope = function(context) {
  var storage = context || {},
      api = {};

  api.get = function(varName, local) {
    if (local && local.has(varName)) return local.get(varName);
    return storage[varName];
  }

  api.set = function(varName, value) {
    storage[varName] = value;
  }

  api.has = function(varName) {
    return _.has(storage, varName);
  }

  return api;
}