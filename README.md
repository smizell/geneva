Geneva
------

This is an example of a JSON flavor of Lisp. This is just for fun at this point, so please do not take this too seriously!

## Example

```javascript
geneva = Geneva();

// Should be equal to 6
var logicExample = geneva.run(
  ["if", ["=", 5, 5],
    ["inc", 5],
    ["+", 4, 4]]
);

// Should return [2, 3, 4]
var mapExample = geneva.run(["map", ["func", "inc"], ["list", 1, 2, 3]]);

// Should return 8
var mapExample = geneva.run(["reduce", ["func", "+"], ["list", 2, 3, 3]]);

// The function value should return 100
var defExample = geneva.run(
  ["geneva",
    ["def", "test", 100],
    ["value", "test"]]
);
```