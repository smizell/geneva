var Variable = require('../lib/types').Variable,
    CoreFunction = require('../lib/types').CoreFunction,
    Scope = require("../lib/scope"),
    chai = require('chai'),
    expect = chai.expect;

describe("Types", function() {
  describe("Variable", function() {
    describe("get", function() {
      it("should return its value", function() {
        var variable = new Variable(5);
        expect(variable.get()).to.equal(5);
      });
    });

    describe("set", function() {
      it("should set its value", function() {
        var variable = new Variable();
        variable.set(5);
        expect(variable.get()).to.equal(5);
      });
    });
  });

  describe("CoreFunction", function() {
    describe("call", function() {
      it("should call the function given", function() {
        var fn = function(args) { return args[0] + args[1] },
            sum = new CoreFunction(fn);
        expect(sum.call([3, 4])).to.equal(7);
      });

      it("should be able to use global scope", function() {
        var scope = Scope({value1: 3}),
            fn = function(args, global) { return global.get("value1") + args[0] },
            sum = new CoreFunction(fn);
        expect(sum.call([4], scope)).to.equal(7);
      });

      it("should be able to use local scope", function() {
        var scope = Scope({value1: 3}),
            fn = function(args, global, local) { return local.get("value1") + args[0] },
            sum = new CoreFunction(fn);
        expect(sum.call([4], Scope(), scope)).to.equal(7);
      });
    });
  });
});