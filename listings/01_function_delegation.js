var div = function(a, b) {
    return a / b;
};

var half = function(a) {
    return div(a, 2);
};

var inv = function(b) {
    return div(1, b);
};

console.log(half(6));
console.log(inv(4));
