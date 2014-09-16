var utils = require('../lib/utils'),
    chai = require('chai'),
    expect = chai.expect;

describe("Utils", function() {
  describe("getVarName", function() {
    it("should return the variable name", function() {
      expect(utils.getVarName("~varName")).to.equal("varName");
    });
  });
  
  describe("functions", function() {
    describe("isFuncCall", function() {
      describe("when not an array", function() {
        it("should be false", function() {
          var nonCall = utils.isFuncCall(3);
          expect(nonCall).to.be.false;
        });
      });

      describe("when an array with no !", function() {
        it("should be false", function() {
          var nonCall = utils.isFuncCall([1, 2]);
          expect(nonCall).to.be.false;
        });
      });

      describe("when an array with !", function() {
        it("should be false", function() {
          var call = utils.isFuncCall(["!identity", 2]);
          expect(call).to.be.true;
        });
      });
    });
  });

  describe("variables", function() {
    describe("isVar", function() {
      describe("when not a string", function() {
        it("should return false", function () {
          var nonVar = utils.isVar(4);
          expect(nonVar).to.be.false;
        });
      });

      describe("when not a variable", function() {
        it("should return false", function () {
          var nonVar = utils.isVar("test");
          expect(nonVar).to.be.false;
        });
      });

      describe("when a variable", function() {
        it("should return false", function () {
          var testVar = utils.isVar("~test");
          expect(testVar).to.be.true;
        });
      });
    });
  });
});