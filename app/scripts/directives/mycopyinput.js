'use strict';

/**
 * @ngdoc directive
 * @name strategycanvasFrontendApp.directive:myCopyInput
 * @description copy input to clipboard on click
 * # myCopyInput
 */
angular.module('strategycanvasFrontendApp')
  .directive('myCopyInput', function () {
    return {
      restrict: 'A',
      scope:false,
      link: function($scope, elm) {
        elm.on('click', function(){
            var doc = document,
                text = elm[0],
                range, selection;
          if (doc.body.createTextRange) { //ms
              range = doc.body.createTextRange();
              range.moveToElementText(text);
              range.select();
          } else if (window.getSelection) { //all others
              selection = window.getSelection();        
              range = doc.createRange();
              range.selectNodeContents(text);
              selection.removeAllRanges();
              selection.addRange(range);
          }
        });
      }
    };
  });
