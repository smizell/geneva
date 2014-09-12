Geneva
------

This is an example of a JSON flavor of Lisp. This is just for fun at this point, so please do not take this too seriously!

## Example

```javascript
// The ! is used to call a function
// The ~ is used to pass around variables
geneva = Geneva();

// Should be equal to 6
var logicExample = geneva.run(
  ["!if", ["!=", 5, 5],
    ["!inc", 5],
    ["!+", 4, 4]]
);

// Should return [2, 3, 4]
var mapExample = geneva.run(["!map", "~inc", [1, 2, 3]]);

// Should return 8
var reduceExample = geneva.run(["!reduce", "~+", [2, 3, 3]]);
```