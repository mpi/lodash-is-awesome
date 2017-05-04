var _ = require('lodash/fp');

function customizer(val, op){
  if(_.isFunction(op)){
    return op.apply(this, [val]);
  }
  if(_.isRegExp(op)){
    return op.test(val);
  }
}

// general-purpose, higher-order functions:

var patch = recipe => _.mergeWith(customizer, _, recipe);
var matches = _.isMatchWith(customizer);
var forAll = _.map;
var removeIf = _.reject;
var toggle = _.negate(_.identity);

Function.prototype.onlyIf = function(condFn) {
  return _.cond([[condFn, this]]);
};
Function.prototype.otherwise = function(defaultFn) {
  var noResult = _.flow([this, _.isUndefined]);
  return _.cond([[noResult, defaultFn], [_.T, this]]);
};

// domain-specific functions:

var addItem = item => patch({
  items: _.concat({title: item})
});
var complete = patch({
  completed: true
});
var completeAll = patch({
  items: forAll(complete)
});
var isCompleted = matches({
  complete: true
});
var clearCompleted = patch({
  items: removeIf(isCompleted)
});
var toggleItem = patch({
  completed: toggle
});
var completeItemIf = condFn => patch({
  items: forAll(complete.onlyIf(condFn).otherwise(_.identity))
});
var changeTitleTo = title => patch({
  title: title
});
var hasTitle = title => matches({
  title: title
});
var renameItem = (newTitle, oldTitle) => patch({
  items: forAll(changeTitleTo(newTitle).onlyIf(hasTitle(oldTitle)).otherwise(_.identity))
});
var removeItem = (title) => patch({
  items: removeIf(hasTitle(oldTitle))
});

// demo:

var program = _.flow([
  addItem('Learn Lodash'),
  addItem('Learn FP'),
  addItem('Write Blog Post'),
  renameItem('Learn Functional Programming', 'Learn FP'),
  completeItemIf(hasTitle(/Learn/))
]);

console.log(program({items: []}));
