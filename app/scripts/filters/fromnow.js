'use strict';

/**
 * @ngdoc filter
 * @name strategycanvasFrontendApp.filter:fromNow
 * @function
 * @description
 * # fromNow
 * Filter in the strategycanvasFrontendApp.
 */
angular.module('strategycanvasFrontendApp')
  .filter('fromNow', function () {
    return function(dateString) {
      return moment(new Date(dateString)).fromNow(true);
    };
  });
