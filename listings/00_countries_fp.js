var _  = require('lodash/fp');
var cities = require('./cities.json');

var countriesWithLargestCities = _.flow([
  _.filter(_.conforms({ population: _.gte(_, 5000000) })),
  _.countBy('country'),
  _.toPairs,
  _.map(_.zipObject(['country', 'numOfCities'])),
  _.orderBy('numOfCities', 'desc'),
  _.take(5)
])(cities);

console.log(countriesWithLargestCities);
