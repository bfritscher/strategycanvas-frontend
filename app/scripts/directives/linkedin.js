'use strict';

/**
 * @ngdoc directive
 * @name strategycanvasFrontendApp.directive:linkedin
 * @description
 * # linkedin
 */
angular.module('strategycanvasFrontendApp')
  .directive('linkedin', function () {
    return {
      template: '<script type="IN/MemberProfile" data-id="http://www.linkedin.com/in/borisfritscher" data-format="inline" data-related="false"></script>',
      restrict: 'E',
      link: function postLink(scope, element) {
        /* global IN: false */
        if(IN && IN.parse){
            IN.parse(element[0]);
        }
      }
    };
  });
