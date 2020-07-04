const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Lambda", () => {
  context("when a basic lambda is defined", () => {
    it("should be callable", () => {
      const geneva = new Geneva();
      const result = geneva.run([
        "!do",
        ["!def", "foo", ["!lambda", ["x"], "~x"]],
        ["!foo", 5],
      ]);
      expect(result).to.equal(5);
    });
  });

  context("when defining a multi-line function", function () {
    it("returns the last expression", function () {
      const geneva = new Geneva();
      const result = geneva.run([
        "!do",
        [
          "!def",
          "foo",
          ["!lambda", ["x"], ["!def", "n", 4], ["!multiply", "~x", "~n"]],
        ],
        ["!foo", 5],
      ]);
      expect(result).to.equal(20);
    });
  });

  context("global scope", () => {
    context("when a variable is defined first", () => {
      it("should be accessible", () => {
        const geneva = new Geneva();
        const result = geneva.run([
          "!do",
          ["!def", "foo", "bar"],
          ["!def", "callFoo", ["!lambda", [], "~foo"]],
          ["!callFoo"],
        ]);
        expect(result).to.equal("bar");
      });
    });

    context("when a variable is defined after", () => {
      it("should not be accessible", () => {
        const geneva = new Geneva();
        const runner = () => {
          const result = geneva.run([
            "!do",
            ["!def", "getFoo", ["!lambda", [], "~foo"]],
            ["!def", "foo", "bar"],
            ["!getFoo"],
          ]);
        };
        expect(runner).to.throw;
      });
    });
  });

  context("when a more complex lambda is defined", () => {
    it("returns the correct value for nested calls", () => {
      const geneva = new Geneva();
      const result = geneva.run([
        "!do",
        [["!lambda", [], [["!lambda", ["x"], "~x"], 42]]],
      ]);
      expect(result).to.equal(42);
    });

    it("passes along scope to other functions", () => {
      const geneva = new Geneva();
      const result = geneva.run([
        "!map",
        ["!fn", ["n"], ["!multiply", "~n", 10]],
        [1, 2, 3],
      ]);
      expect(result).to.deep.equal([10, 20, 30]);
    });

    it("returns handles scope correctly", () => {
      const geneva = new Geneva();
      const result = geneva.run([
        "!do",
        ["!def", "x", 42],
        // Define a nested lambda function
        ["!def", "foo", ["!fn", [], [["!fn", [], "~x"]]]],
        // Change the value of x
        ["!def", "x", 100],
        // It should return the original value
        ["!foo"],
      ]);
      expect(result).to.equal(42);
    });

    it("can be passed to other functions", function () {
      const geneva = new Geneva();
      const result = geneva.run([
        "!do",
        ["!defn", "myAdd", ["a", "b"], ["!add", "~a", "~b"]],
        ["!reduce", "~myAdd", 0, [1, 2, 3]],
      ]);
      expect(result).to.equal(6);
    });
  });
});
