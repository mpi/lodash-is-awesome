var _  = require('lodash');
var cities = require('./cities.json');

var countriesWithLargestCities = _(cities)
  .filter(c => c.population > 5000000)
  .countBy('country')
  .toPairs()
  .map(c => _.zipObject(['country', 'numOfCities'], c))
  .orderBy('numOfCities', 'desc')
  .take(5)
  .value();
