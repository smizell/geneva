var _ = require('lodash'),
    CoreFunction = require("./types").CoreFunction,
    Variable = require("./types").Variable,
    Scope = require("./scope"),
    utils = require("./utils");

module.exports = Geneva = function(scope) {
  var api = scope || Scope();

  api.run = function(code, localScope) {
    var local = localScope || Scope();
    if (utils.isVar(code)) return this.get(utils.getVarName(code), local).get();
    if (!utils.isFuncCall(code)) return code;
    var parts = utils.parseFunc(code),
        func = this.get(parts.name);
    return func.call(parts.args, this, local);
  }

  api.set("identity", new CoreFunction(function(args, global, local) {
    return global.run(args[0], local);
  }));

  api.set("def", new CoreFunction(function(args, global, local) {
    global.set(args[0], new Variable(api.run(args[1], local)));
  }));

  return api;
}