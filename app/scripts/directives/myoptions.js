'use strict';

/**
 * @ngdoc directive
 * @name strategycanvasFrontendApp.directive:myOptions
 * @description
 * # myOptions
 */
angular.module('strategycanvasFrontendApp')
  .directive('myOptions', function ($compile, $window, $location) {
    return function($scope, elm){
      elm.clickover({html:true,
        placement:'bottom',
        trigger:'click',
        width: 350,
        onShown: function(){
          $compile(this.$tip)($scope);
          $scope.$apply();
          $window.ga('send', 'pageview', {'page': $location.path() + '/options'});
        },
        content:$('#optionsDialog').html()
      });
    };
  });
