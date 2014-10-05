var Geneva = require('../lib/base'),
    Scope = require("../lib/scope"),
    Variable = require("../lib/types").Variable,
    chai = require('chai'),
    expect = chai.expect;

describe("Geneva Core", function() {
  beforeEach(function() {
    geneva = Geneva();
  });

  describe("base", function() {
    describe("def", function() {
      it("should set a stored variable", function() {
        geneva.run(["!def", "test", "value"]);
        var testVar = geneva.get("test");
        expect(testVar.get()).to.equal("value");
      });
    });

    describe("array", function() {
      it("should return a normal array", function() {
        var val = geneva.run([1, 2, 3]);
        expect(val).to.eql([1, 2, 3])
      });

      it("should run code within it", function() {
        var val = geneva.run(
          ["!do",
            ["!def", "a", 2],
            [1, "~a", 3]]);
        expect(val).to.eql([1, 2, 3])
      });
    });

    describe("object", function() {
      it("should return a normal object", function() {
        var val = geneva.run({ foo: "a", bar: "b" });
        expect(val).to.eql({ foo: "a", bar: "b" });
      });

      it("should run code within it", function() {
        var val = geneva.run(
          ["!do",
            ["!def", "a", 2],
            { foo: "~a", bar: [1, "~a", 3] }]);
        expect(val).to.eql({ foo: 2, bar: [1, 2, 3]})
      });
    });

    describe("identity", function() {
      it("should return the value given", function() {
        var identity = geneva.run(["!identity", 4]);
        expect(identity).to.equal(4);
      });

      it("should allow for variables", function() {
        geneva.run(["!def", "test", 4]);
        var identity = geneva.run(["!identity", "~test"]);
        expect(identity).to.equal(4);
      });

      it("should pull from local scope", function() {
        var scope = Scope({test: new Variable(4)}),
            identity = geneva.run(["!identity", "~test"], scope);
        expect(identity).to.equal(4);
      });
    });

    describe("fn", function() {
      it("should allow for creating functions", function() {
        var fn = geneva.run(
          ["!fn", ["x"],
            ["!+", "~x", 1]]);
        expect(fn.call([4], geneva, Scope())).to.eql(5);
      });

      it("should be able to be passed around", function() {
        var fn = geneva.run(
          ["!map", ["!fn", ["x"],
                     ["!+", "~x", 1]],
                   [1, 2, 3]]);
        expect(fn).to.eql([2, 3, 4]);
      });
    });

    describe("do", function() {
      it("should execute each code given", function() {
        var doTest = geneva.run(["!do", ["!def", "x", 4], "~x"]);
        expect(doTest).to.equal(4);
      });
    });

    describe("defn", function() {
      it("should allow for defining a function", function() {
        var fnTest = geneva.run(
          ["!do", 
            ["!defn", "addFour", ["x"],
              ["!+", "~x", 4]],
            ["!addFour", 10]]);
        expect(fnTest).to.equal(14);
      });

      it("should use local scope", function() {
        var fn = geneva.run(
          ["!do",
            ["!def", "x", 10],
            ["!map", ["!fn", ["x"],
                       ["!+", "~x", 1]],
                     [1, 2, 3]]]);
        expect(fn).to.eql([2, 3, 4]);
      });

      it("should not affect global scope", function() {
        var fn = geneva.run(
          ["!do",
            ["!def", "x", 10],
            ["!map", ["!fn", ["x"],
                       ["!+", "~x", 1]],
                     [1, 2, 3]],
            "~x"]);
        expect(fn).to.eql(10);
      });
    });

    describe("let", function() {
      it("should provide a local scope", function() {
        var letTest = geneva.run(
          ["!let", ["x", 5,
                    "y", 10], 
            ["!+", "~x", "~y"]]);
        expect(letTest).to.equal(15);
      });

      it("should process multiple lines", function() {
        var letTest = geneva.run(
          ["!let", ["x", 5,
                    "y", 10], 
            ["!+", "~x", "~y"],
            ["!-", "~y", "~x"]]);
        expect(letTest).to.equal(5);
      });
    });

    describe("eval", function() {
      it("should execute an array", function() {
        expect(geneva.run(["!eval", ["+", 2, 4]])).to.equal(6);
      });
    });

    describe("->>", function() {
      it("should thread the expression through the forms", function() {
        var forms = geneva.run(
          ["!->>", [1, 2, 3],
                   ["!map", "~inc"],
                   ["!map", "~inc"],
                   ["!concat", [0, 2]]]);
        expect(forms).to.eql([0, 2, 3, 4, 5])
      });
    });
  });

  describe("math", function() {
    describe("inc", function() {
      it("should increment a number by one", function() {
        var two = geneva.run(["!inc", 1]);
        expect(two).to.equal(2);
      });
    });

    describe("+", function() {
      it("should add two values", function() {
        var five = geneva.run(["!+", 2, 3]);
        expect(five).to.equal(5);
      });

      it("should add multiple values", function() {
        var ten = geneva.run(["!+", 2, 3, 5]);
        expect(ten).to.equal(10);
      });
    });

    describe("-", function() {
      it("should subtract two values", function() {
        var five = geneva.run(["!-", 10, 5]);
        expect(five).to.equal(5);
      });

      it("should subtract multiple values", function() {
        var three = geneva.run(["!-", 10, 5, 2]);
        expect(three).to.equal(3);
      });
    });

    describe("*", function() {
      it("should multiply numbers", function() {
        var product = geneva.run(["!*", 10, 5, 2]);
        expect(product).to.equal(100);
      });
    });

    describe("/", function() {
      it("should divide two numbers", function() {
        expect(geneva.run(["!/", 10, 5])).to.equal(2);
      });
    });

    describe(">", function() {
      it("should tell if one number is greater than the other", function() {
        expect(geneva.run(["!>", 10, 5])).to.true;
        expect(geneva.run(["!>", 10, 15])).to.false;
      });
    });

    describe(">=", function() {
      it("should tell if one number is greater than or equal the other", function() {
        expect(geneva.run(["!>=", 10, 5])).to.true;
        expect(geneva.run(["!>=", 10, 10])).to.true;
        expect(geneva.run(["!>=", 10, 11])).to.false;
      });
    });

    describe("<", function() {
      it("should tell if one number is greater than the other", function() {
        expect(geneva.run(["!<", 5, 10])).to.true;
        expect(geneva.run(["!<", 20, 15])).to.false;
      });
    });

    describe(">=", function() {
      it("should tell if one number is greater than or equal the other", function() {
        expect(geneva.run(["!<=", 5, 10])).to.true;
        expect(geneva.run(["!<=", 10, 10])).to.true;
        expect(geneva.run(["!<=", 20, 11])).to.false;
      });
    });

    describe("mod", function() {
      it("should return the mod", function() {
        var mod = geneva.run(["!mod", 6, 4]);
        expect(mod).to.equal(2);
      });
    });
  });

  describe("logic", function() {
    describe("=", function() {
      it("should return true for equal values", function() {
        var equal = geneva.run(["!=", 5, 5]);
        expect(equal).to.be.true
      });

      it("should return true for multiple equal values", function() {
        var equal = geneva.run(["!=", 5, 5, 5, 5]);
        expect(equal).to.be.true
      });

      it("should return false for non-equal values", function() {
        var equal = geneva.run(["!=", 5, 4]);
        expect(equal).to.be.false
      });
    });

    describe("not=", function() {
      it("should return false for equal values", function() {
        var equal = geneva.run(["!not=", 5, 5]);
        expect(equal).to.be.false;
      });

      it("should return false for multiple equal values", function() {
        var equal = geneva.run(["!not=", 5, 5, 5, 5]);
        expect(equal).to.be.false;
      });

      it("should return true for non-equal values", function() {
        var equal = geneva.run(["!not=", 5, 4]);
        expect(equal).to.be.true;
      });
    });

    describe("if", function() {
      describe("when else is not given", function() {
        it("should return value if passes", function() {
          var passes = geneva.run(["!if", true, "OK"]);
          expect(passes).to.equal("OK");
        });

        it("should return value if fails", function() {
          var fails = geneva.run(["!if", false, "OK"]);
          expect(fails).to.equal(null);
        });
      });

      describe("when else is given and fails", function() {
        it("should return the else value", function() {
          var fails = geneva.run(["!if", false, "OK", "FAIL"]);
          expect(fails).to.equal("FAIL")
        });
      });
    });

    describe("cond", function() {
      it("should return the first true value", function() {
        var condTest = geneva.run(["!cond", false, "FAIL",
                                            false, "Another FAIL",
                                            true, "SUCCESS",
                                            false, "Last FAIL"]);
        expect(condTest).to.equal("SUCCESS");
      });

      it("should return null if none are true", function() {
        var condTest = geneva.run(["!cond", false, "FAIL",
                                            false, "Another FAIL",
                                            false, "Last FAIL"]);
        expect(condTest).to.be.null;
      });

      it("should return else value if none are true", function() {
        var condTest = geneva.run(["!cond", false, "FAIL",
                                            false, "Another FAIL",
                                            ":else", "NONE PASS"]);
        expect(condTest).to.be.equal("NONE PASS");
      });

      it("should allow for functions", function() {
        var condTest = geneva.run(["!cond", ["!=", 3, 4], "FAIL",
                                            ["!=", 3, 3], "SUCCESS",
                                            ":else", "Last FAIL"]);
        expect(condTest).to.equal("SUCCESS");
      });
    });

    describe("and", function() {
      it("should evaluate each item to see if it's true", function() {
        expect(geneva.run(["!and", ["!=", 1, 1], true])).to.be.true;
        expect(geneva.run(["!and", true, ["!=", 1, 2], true])).to.be.false;
      });
    });

    describe("or", function() {
      it("should evaluate each item to see if it's true", function() {
        expect(geneva.run(["!or", ["!=", 1, 1], false])).to.be.true;
        expect(geneva.run(["!or", false, ["!=", 1, 2], false])).to.be.false;
      });
    });
  });

  describe("functional", function() {
    describe("map", function() {
      it("should map to a function", function() {
        var inc = geneva.run(["!map", "~inc", [1, 2, 3]]);
        expect(inc).to.eql([2, 3, 4]);
      });
    });

    describe("reduce", function() {
      it("should reduce to a function", function() {
        var sum = geneva.run(["!reduce", "~+", [1, 2, 3]]);
        expect(sum).to.eql(6);
      });

      it("should accept a first value", function() {
        var sum = geneva.run(["!reduce", "~+", 10, [1, 2, 3]]);
        expect(sum).to.equal(16);
      });
    });

    describe("filter", function() {
      it("should filter an array", function() {
        var even = geneva.run(
          ["!filter", "~even?", [1, 2, 3, 4, 10, 11]]);
        expect(even).to.eql([2, 4, 10]);
      });
    });

    describe("concat", function() {
      it("should concat arrays", function() {
        var concat = geneva.run(["!concat", [1, 2, 3], [4, 5]]);
        expect(concat).to.eql([1, 2, 3, 4, 5]);
      });
    });

    describe("range", function() {
      describe("when one arg given", function() {
        it("should return the range", function() {
          var range = geneva.run(["!range", 5]);
          expect(range).to.eql([0, 1, 2, 3, 4]);
        });
      });

      describe("when two args given", function() {
        it("should return the range", function() {
          var range = geneva.run(["!range", 0, 5]);
          expect(range).to.eql([0, 1, 2, 3, 4]);
        });
      });

      describe("when three args given", function() {
        it("should return the range", function() {
          var range = geneva.run(["!range", 0, 5, 2]);
          expect(range).to.eql([0, 2, 4]);
        });
      });
    });

    describe("get-in", function() {
      it("should get nested values", function() {
        var value = geneva.run(
          ["!do",
            ["!def", "x", [{ foo: 1, bar: 2}]],
            ["!get-in", "~x", [0, "foo"]]])
        expect(value).to.equal(1);
      });
    });

    describe("assoc-in", function() {
      it("should set nested values in an array", function() {
        var value = geneva.run(
          ["!do",
            ["!def", "x", [{ foo: 1, bar: 2}]],
            ["!def", "newX",
              ["!assoc-in", "~x", [0, "foo"], 5]],
            "~newX"]);
        expect(value[0].foo).to.equal(5);
      });

      it("should set nested values in an object", function() {
        var value = geneva.run(
          ["!do",
            ["!def", "x", { foo: [1, { boo: 5}, 3]}],
            ["!def", "newX",
              ["!assoc-in", "~x", ["foo", 1, "boo"], 10]],
            "~newX"]);
        expect(value.foo[1].boo).to.equal(10);
      });

      it("should not change the original", function() {
        var value = geneva.run(
          ["!do",
            ["!def", "x", { foo: [1, { boo: 5}, 3]}],
            ["!def", "newX",
              ["!assoc-in", "~x", ["foo", 1, "boo"], 10]],
            "~x"]);
        expect(value.foo[1].boo).to.equal(5);
      });
    });
  });

  describe("shortcuts", function() {
    describe("zero?", function() {
      it("should return the correct value", function() {
        expect(geneva.run(["!zero?", 0])).to.be.true;
        expect(geneva.run(["!zero?", 1])).to.be.false;
      });
    });

    describe("even?", function() {
      it("should return the correct value", function() {
        expect(geneva.run(["!even?", 4])).to.be.true;
        expect(geneva.run(["!even?", 5])).to.be.false;
      });
    });

    describe("odd?", function() {
      it("should return the correct value", function() {
        expect(geneva.run(["!odd?", 4])).to.be.false;
        expect(geneva.run(["!odd?", 5])).to.be.true;
      });
    });
  });

  describe("string", function() {
    describe("str", function() {
      it("should concat a string", function() {
        expect(geneva.run(["!str", "Hello", " ", "World"])).to.equal("Hello World");
      });
    });

    describe("join", function() {
      it("should join an array", function() {
        expect(geneva.run(["!join", ",", [1, 2, 3]])).to.equal("1,2,3");
      });
    });

    describe("split", function() {
      it("should split an array", function() {
        expect(geneva.run(["!split", "1,2,3", ","])).to.eql(["1", "2", "3"]);
      });
    });

    describe("starts-with?", function() {
      it("should tell if a string starts with a prefix", function() {
        expect(geneva.run(["!starts-with?", "World", "Wo"])).to.be.true;
        expect(geneva.run(["!starts-with?", "World", "Won"])).to.be.false;
      });
    });

    describe("ends-with?", function() {
      it("should tell if a string ends with a suffix", function() {
        expect(geneva.run(["!ends-with?", "World", "ld"])).to.be.true;
        expect(geneva.run(["!ends-with?", "World", "Wo"])).to.be.false;
      });
    });

    describe("contains?", function() {
      it("should tell if a string contains a substring", function() {
        expect(geneva.run(["!contains?", "World", "ld"])).to.be.true;
        expect(geneva.run(["!contains?", "World", "Hello"])).to.be.false;
      });
    });

    describe("true?", function() {
      it("should return correct true/false values", function() {
        expect(geneva.run(["!true?", ["!=", 1, 1]])).to.be.true;
        expect(geneva.run(["!true?", false])).to.be.false;
      });
    });

    describe("false?", function() {
      it("should return correct true/false values", function() {
        expect(geneva.run(["!false?", ["!=", 1, 1]])).to.be.false;
        expect(geneva.run(["!false?", false])).to.be.true;
      });
    });

    describe("empty?", function() {
      it("should tell if an array is empty or not", function() {
        expect(geneva.run(["!empty?", []])).to.be.true;
        expect(geneva.run(["!empty?", [1, 2]])).to.be.false;
      });
    });

    describe("every?", function() {
      it("should return true if all pass logical test", function() {
        expect(geneva.run(["!every?", "~even?", [2, 4, 6]])).to.be.true;
        expect(geneva.run(["!every?", "~even?", [2, 5, 6]])).to.be.false;
      });
    });

    describe("nil?", function() {
      it("should define whether a value is nil or not", function() {
        expect(geneva.run(["!nil?", null])).to.be.true;
        expect(geneva.run(["!nil?", undefined])).to.be.false;
        expect(geneva.run(["!nil?", 1])).to.be.false;
      });
    });
  });

  describe("arrays", function() {
    describe("first", function() {
      it("should return the first of an array", function() {
        expect(geneva.run(["!first", [3, 4, 5]])).to.be.equal(3);
      });
    });

    describe("nth", function() {
      it("should return the value at the index", function() {
        expect(geneva.run(["!nth", [3, 4, 5], 1])).to.be.equal(4);
      });
    });

    describe("conj", function() {
      it("should combine arrays", function() {
        expect(geneva.run(["!conj", [1, 2, 3], 4, 5])).to.be.eql([1, 2, 3, 4, 5]);
        expect(geneva.run(["!conj", null, 5])).to.be.eql([5]);
      });
    });

    describe("drop", function() {
      it("should drop n number of items", function() {
        expect(geneva.run(["!drop", 2, [1, 2, 3, 4]])).to.be.eql([3, 4]);
        expect(geneva.run(["!drop", 5, [1, 2, 3, 4]])).to.be.eql([]);
      });
    });
  });

  describe("type checking", function() {
    describe("array?", function() {
      it("should tell if an item is an array or not", function() {
        expect(geneva.run(["!array?", [1, 2]])).to.be.true;
        expect(geneva.run(["!array?", 4])).to.be.false;
      });
    });

    describe("string?", function() {
      it("should tell if an item is an string or not", function() {
        expect(geneva.run(["!string?", "Hello World"])).to.be.true;
        expect(geneva.run(["!string?", 4])).to.be.false;
      });
    });

    describe("object?", function() {
      it("should tell if an item is an object or not", function() {
        expect(geneva.run(["!object?", { foo: "bar" }])).to.be.true;
        expect(geneva.run(["!object?", 4])).to.be.false;
      });
    });

    describe("number?", function() {
      it("should tell if an item is an string or not", function() {
        expect(geneva.run(["!number?", 4])).to.be.true;
        expect(geneva.run(["!number?", "foo bar"])).to.be.false;
      });
    });

    describe("bool?", function() {
      it("should tell if an item is an boolean or not", function() {
        expect(geneva.run(["!bool?", true])).to.be.true;
        expect(geneva.run(["!bool?", "foo bar"])).to.be.false;
      });
    });
  });
});