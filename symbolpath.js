'use strict';

/**
 * @ngdoc filter
 * @name strategycanvasFrontendApp.filter:symbolPath
 * @function
 * @description
 * # symbolPath
 * Filter in the strategycanvasFrontendApp.
 */
angular.module('strategycanvasFrontendApp')
  .filter('symbolPath', function () {
    return function(type) {
      return d3.svg.symbol().type(type)();
    };
  });
