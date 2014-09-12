var _ = require('lodash');

module.exports = Geneva = function(context, globalStore) {
  var api = context || {},
      store = globalStore || {},
      local = {};

  api.get = function(varName) {
    if (_.has(local, varName)) return local[varName];
    return store[varName];
  }

  api.set = function(name, itemType, value) {
    store[name] = { type: itemType, value: value };
  }

  api.isFuncCall = function(code) {
    if (!Array.isArray(code)) return false;
    if (typeof code[0] !== "string") return false;
    if (code[0].charAt(0) == "!") return true;
    return false;
  }

  api.addFunc = function(funcName, func) {
    this.set(funcName, "func", func);
  }

  api.isVar = function(value) {
    if (typeof value !== "string") return false;
    if (value.charAt(0) === "~") return true;
    return false;
  }

  api.setVar = function(varName, value) {
    this.set(varName, "var", value);
  }

  api.setLocal = function(varName, itemType, value) {
    local[varName] = { type: itemType, value: value };
  }

  api.run = function(code) {
    return code;
  }

  return api;
}