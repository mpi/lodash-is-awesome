var _ = require('lodash');
var toBeOrNotToBe = require('./to_be_or_not_to_be');

var top5Words = _.flow([
    _.toLower,
    _.words,
    _.countBy,
    _.toPairs,
    _.partial(_.orderBy, _, 1, 'desc'),
    _.partial(_.take, _, 5),
    _.fromPairs
]);


console.log(top5Words(toBeOrNotToBe));
