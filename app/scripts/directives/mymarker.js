'use strict';

/**
 * @ngdoc directive
 * @name strategycanvasFrontendApp.directive:myMarker
 * @description
 * # myMarker
 */
angular.module('strategycanvasFrontendApp')
  .directive('myMarker', function () {
    return {
      restrict: 'A',
      templateUrl: 'marker.html',
      replace: true,
      scope: {
        serie:'=serie'
      }
    };
  });
