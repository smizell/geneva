var utils = require('../lib/utils'),
    chai = require('chai'),
    expect = chai.expect;

describe("Geneva Utils", function() {
  describe("parseFunc", function() {
    it("should return the correct function name", function() {
      var funcName = utils.parseFunc(["identity", 4]).funcName;
      expect(funcName).to.equal("identity")
    }),

    it("should return the correct arguments", function() {
      var args = utils.parseFunc(["identity", 4]).args;
      expect(args).to.eql([4])
    })
  })
});