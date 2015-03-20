'use strict';

/**
 * @ngdoc directive
 * @name strategycanvasFrontendApp.directive:myDraggable
 * @description set note width while dragging fix... no scope.
 * # myDraggable
 */
angular.module('strategycanvasFrontendApp')
  .directive('myDraggable', function () {
    return {
      restrict: 'A',
      scope:false,
      link: function($scope, elm) {
        var offset;
        d3.select(elm.find('.handler')[0])
        .call(d3.behavior.drag()
          .on('dragstart',function(){
            var x = d3.event.sourceEvent.changedTouches ?  d3.event.sourceEvent.touches[0].clientX : d3.event.sourceEvent.x; 
            offset = x - elm.width();
          })
          .on('drag', function () {
            $scope.$apply(function(){
              var width = d3.event.x - offset;
              var widthOpen = width;
              if(width <= 0){
                width = '0';
                widthOpen = '250';
              }
              $scope.notes.width = width;
              $scope.notes.widthOpen = widthOpen;
            });
            elm.width();
          })
          //.on("dragend", function (d) {})
        );
      }
    };
  });
