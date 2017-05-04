var _ = require('lodash');

function partial(fn) {
  var bound = [].slice.apply(arguments, [1]);
  return function(){
    var args = bound.concat([].slice.apply(arguments));
    return fn.apply(this, args);
  };
}

function _partial(fn) {
  var bound = _.tail(arguments);
  return function(){
    var args = _.concat(bound, arguments);
    return fn.apply(this, args);
  };
}

function mul(a, b){
  return a * b;
}

var dbl = _partial(mul, 2);

function sumOf(){
  return _.sum(arguments);
}

var parseIntC = _.curry(parseInt, 1);

console.log(parseIntC('123'));
