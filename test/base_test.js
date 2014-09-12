var Geneva = require('../lib/base'),
    chai = require('chai'),
    expect = chai.expect;

describe("Geneva Core", function() {
  beforeEach(function() {
    geneva = Geneva();
  });

  describe("types", function() {
    describe("functions", function() {
      describe("addFunc", function() {
        it("should add a function", function() {
          var identity = function(x) { return x };
          geneva.addFunc("identity", identity);
          expect(geneva.get("identity").value).to.eql(identity);
        });
      });

      describe("isFuncCall", function() {
        describe("when not an array", function() {
          it("should be false", function() {
            var nonCall = geneva.isFuncCall(3);
            expect(nonCall).to.be.false;
          });
        });

        describe("when an array with no !", function() {
          it("should be false", function() {
            var nonCall = geneva.isFuncCall([1, 2]);
            expect(nonCall).to.be.false;
          });
        });

        describe("when an array with !", function() {
          it("should be false", function() {
            var call = geneva.isFuncCall(["!identity", 2]);
            expect(call).to.be.true;
          });
        });
      });
    });
  
    describe("variables", function() {
      describe("setVar", function() {
        it("should set a variable", function() {
          geneva.setVar("test", 4);
          var variable = geneva.get("test");
          expect(variable.value).to.equal(4);
        });
      });

      describe("isVar", function() {
        describe("when not a string", function() {
          it("should return false", function () {
            var nonVar = geneva.isVar(4);
            expect(nonVar).to.be.false;
          });
        });

        describe("when not a variable", function() {
          it("should return false", function () {
            var nonVar = geneva.isVar("test");
            expect(nonVar).to.be.false;
          });
        });

        describe("when a variable", function() {
          it("should return false", function () {
            var testVar = geneva.isVar("~test");
            expect(testVar).to.be.true;
          });
        });
      });
    });
  });

  describe("storage", function() {
    describe("get", function() {
      it("should get a value", function() {
        var store = Geneva({}, { test: { type: "var", value: 4 }});
        expect(store.get("test").value).to.equal(4);
      });
    });

    describe("set", function() {
      it("should set a value", function() {
        geneva.set("test", "var", 4);
        expect(geneva.get("test").value).to.equal(4);
      })
    });

    describe("local", function() {
      describe("setLocal", function() {
        it("should set a local variable", function() {
          geneva.setLocal("test", "var", 4);
          expect(geneva.get("test").value).to.equal(4);
        });
      })
    });
  });

  describe("base", function() {
    describe("def", function() {
      it("should set a stored variable", function() {
        geneva.run(["!def", "test", "value"]);
        var testVar = geneva.get("test");
        expect(testVar.value).to.equal("value");
      });
    });

    describe("array", function() {
      it("should return a normal array", function() {
        var val = geneva.run([1, 2, 3]);
        expect(val).to.eql([1, 2, 3])
      });
    });

    describe("identity", function() {
      it("should return the value given", function() {
        var identity = geneva.run(["!identity", 4]);
        expect(identity).to.equal(4);
      });

      it("should allow for variables", function() {
        geneva.set("test", "var", 4)
        var identity = geneva.run(["!identity", "~test"]);
        expect(identity).to.equal(4);
      });
    });

    describe("fn", function() {
      it("should allow for creating functions", function() {
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
    })
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
    });
  });
});