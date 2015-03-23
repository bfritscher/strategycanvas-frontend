'use strict';

/**
 * @ngdoc service
 * @name strategycanvasFrontendApp.log
 * @description
 * # log
 * Factory in the strategycanvasFrontendApp.
 */
angular.module('strategycanvasFrontendApp')
  .factory('log', function ($window) {
    function toArray(arg){
      var array = [];
      for(var i=0; i< arg.length; i++){
        array.push(arg[i]);
      }
      return array;
    }
    // Public API here
    return {
      event: function () {
        if($window.ga){
          $window.ga.apply(this, ['send', 'event'].concat(toArray(arguments)));
        }
      },
      pageview: function(){
        if($window.ga){
          $window.ga.apply(this, ['send', 'pageview'].concat(toArray(arguments)));
        }
      }
    };
  });
