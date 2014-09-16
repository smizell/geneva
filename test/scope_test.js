var Scope = require('../lib/scope'),
    chai = require('chai'),
    expect = chai.expect;

describe("Scope", function() {
  describe("get", function() {
    it("should get the value of a variable", function() {
      var scope = Scope({foo: "bar"});
      expect(scope.get("foo")).to.equal("bar");
    });

    describe("when a local scope is given", function() {
      it("should return the value from local scope", function() {
        var global = Scope(),
            local = Scope({foo: "bar"});
        expect(global.get("foo")).to.be.undefined;
        expect(global.get("foo", local)).to.equal("bar");
      });
    });
  });

  describe("set", function() {
    it("should set the value of a variable", function() {
      var scope = Scope();
      scope.set("foo", "bar");
      expect(scope.get("foo")).to.equal("bar");
    });
  });

  describe("has", function() {
    describe("when it has the variable", function() {
      it("should return true", function() {
        var scope = Scope({foo: "bar"});
        expect(scope.has("foo")).to.be.true;
      });
    });
  });

  describe("merge", function() {
    it("should return true", function() {
      var scope1 = Scope({foo: 1, test: 5}),
          scope2 = Scope({foo: 10, bar: 2}),
          scope3 = scope1.merge(scope2);
      expect(scope3.has("foo")).to.be.true;
      expect(scope3.get("foo")).to.equal(10);
      expect(scope3.has("bar")).to.be.true;
      expect(scope3.get("test")).to.equal(5);
    });
  });
});