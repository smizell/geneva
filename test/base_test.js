var Geneva = require('../lib/base'),
    _ = require('mori'),
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
  });
});