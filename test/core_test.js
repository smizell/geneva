var Geneva = require('../lib/core').Geneva,
    chai = require('chai'),
    expect = chai.expect;

describe("Geneva Core", function() {
  beforeEach(function() {
    geneva = Geneva();
  });

  describe("isCallable", function() {
    it("should return true if callable", function() {
      var callable = geneva.isCallable(["identity", 4]);
      expect(callable).to.be.true
    });
  });

  describe("callFuncByName", function() {
    it("should call the correct function", function() {
      var identity = geneva.callFuncByName('identity', [4]);
      expect(identity).to.equal(4);
    });
  });

  describe("callFunc", function() {
    it("should parse and call the function", function() {
      var identity = geneva.callFunc(["identity", 4]);
      expect(identity).to.equal(4);
    });
  });

  describe("run", function() {
    it("should parse and call the function", function() {
      var identity = geneva.run(["identity", 4]);
      expect(identity).to.equal(4);
    });
  });

  describe("getFunc", function() {
    describe("when the function is a core function", function() {
      it("should return the function", function() {
        var identity = geneva.getFunc("identity");
        expect(identity([4])).to.equal(4);
      });
    });
  });

  describe("addFunc", function() {
    it("should add a function to the list", function() {
      var expectedCount = geneva.funcs.length + 1;
      geneva.addFunc("test", function() {});
      expect(geneva.funcs.length).to.equal(expectedCount);
    });
  });

  describe("identity", function() {
    describe("when no args are given", function() {
      describe("when the function is a core function", function() {
        it("should return the function", function() {
          var func = geneva.callFunc(["identity"]);
          expect(func).to.eql(geneva.getFunc("identity"));
        });
      });
    });

    it("should return the value given", function() {
      var identity = geneva.callFunc(["identity", 4]);
      expect(identity).to.equal(4);
    });

    it("should parse functions recursively", function() {
      var identity = geneva.callFunc(["identity", ["identity", 4]]);
      expect(identity).to.equal(4);
    })
  });

  describe("list", function() {
    it("should return an array", function() {
      var list = geneva.callFunc(["list", 1, 2, 3]);
      expect(list).to.eql([1, 2, 3]);
    });

    it("should parse functions recursively", function() {
      var list = geneva.callFunc(["list", 1, ["list", "a", "b"], 3]);
      expect(list).to.eql([1, ["a", "b"], 3]);
    });
  });

  describe("math", function() {
    describe("inc", function() {
      it("should increment a number by one", function() {
        var two = geneva.callFunc(["inc", 1]);
        expect(two).to.equal(2);
      });
    });

    describe("+", function() {
      it("should add two values", function() {
        var five = geneva.callFunc(["+", 2, 3]);
        expect(five).to.equal(5);
      });

      it("should add multiple values", function() {
        var ten = geneva.callFunc(["+", 2, 3, 5]);
        expect(ten).to.equal(10);
      });
    });

    describe("-", function() {
      it("should subtract two values", function() {
        var five = geneva.callFunc(["-", 10, 5]);
        expect(five).to.equal(5);
      });

      it("should subtract multiple values", function() {
        var three = geneva.callFunc(["-", 10, 5, 2]);
        expect(three).to.equal(3);
      });
    });
  });

  describe("logic", function() {
    describe("=", function() {
      it("should return true for equal values", function() {
        var equal = geneva.callFunc(["=", 5, 5]);
        expect(equal).to.be.true
      });

      it("should return true for multiple equal values", function() {
        var equal = geneva.callFunc(["=", 5, 5, 5, 5]);
        expect(equal).to.be.true
      });

      it("should return false for non-equal values", function() {
        var equal = geneva.callFunc(["=", 5, 4]);
        expect(equal).to.be.false
      });
    });

    describe("not=", function() {
      it("should return false for equal values", function() {
        var equal = geneva.callFunc(["not=", 5, 5]);
        expect(equal).to.be.false;
      });

      it("should return false for multiple equal values", function() {
        var equal = geneva.callFunc(["not=", 5, 5, 5, 5]);
        expect(equal).to.be.false;
      });

      it("should return true for non-equal values", function() {
        var equal = geneva.callFunc(["not=", 5, 4]);
        expect(equal).to.be.true;
      });
    });

    describe("if", function() {
      describe("when else is not given", function() {
        it("should return value if passes", function() {
          var passes = geneva.callFunc(["if", true, "OK"]);
          expect(passes).to.equal("OK");
        });

        it("should return value if fails", function() {
          var fails = geneva.callFunc(["if", false, "OK"]);
          expect(fails).to.equal(null);
        });
      });

      describe("when else is given and fails", function() {
        it("should return the else value", function() {
          var fails = geneva.callFunc(["if", false, "OK", "FAIL"]);
          expect(fails).to.equal("FAIL")
        });
      });
    });
  });

  describe("functional", function() {
    describe("map", function() {
      it("should map to a function", function() {
        var inc = geneva.callFunc(["map", ["inc"], ["list", 1, 2, 3]]);
        expect(inc).to.eql([2, 3, 4]);
      });
    });

    describe("reduce", function() {
      it("should reduce to a function", function() {
        var sum = geneva.callFunc(["reduce", ["+"], ["list", 1, 2, 3]]);
        expect(sum).to.eql(6);
      });
    });
  });
});