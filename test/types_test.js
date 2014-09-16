var Variable = require('../lib/types').Variable,
    CoreFunction = require('../lib/types').CoreFunction,
    UserFunction = require('../lib/types').UserFunction,
    Scope = require("../lib/scope"),
    Geneva = require("../lib/base")
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

  describe("UserFunction", function() {
    it("should allow for defining functions", function() {
      var global = Geneva(),
          fn = new UserFunction(["x"], [["!+", "~x", 4]]);
      expect(fn.call([5], global, Scope())).to.equal(9);
    });

    it("should work with the global scope", function() {
      var global = Geneva(),
          fn = new UserFunction(["x"], [["!+", "~x", "~y"]]);
      global.run(["!def", "y", 4])
      expect(fn.call([5], global, Scope())).to.equal(9);
    });

    it("should take a variable", function() {
      var global = Geneva(),
          fn = new UserFunction(["x"], [["!+", 5, "~x"]]);
      global.setVar("y", 4);
      expect(fn.call(["~y"], global, Scope())).to.equal(9);
    });

    it("should take a function", function() {
      var global = Geneva(),
          fn = new UserFunction(["x"], [["!+", 5, "~x"]]);
      expect(fn.call([["!+", 2, 2]], global, Scope())).to.equal(9);
    });

    it("should use local scope over global", function() {
      var global = Geneva(),
          fn = new UserFunction(["x"], [["!+", "~x", 4]]);
      global.set("x", new Variable(100));
      expect(fn.call([5], global, Scope())).to.equal(9);
    });

    it("should not affect global scope", function() {
      var global = Geneva(),
          local = Scope(),
          fn = new UserFunction(["x"], [["!+", "~x", 4]]);
      global.set("x", new Variable(100));
      fn.call([5], global, local);
      expect(global.get("x", local).get()).to.equal(100);
    });
  })
});