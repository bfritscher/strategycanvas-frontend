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
        var x;
        var y;
        d3.select(elm.find('.handler')[0])
        .on("click", function() {
          if (d3.event.defaultPrevented){
            return; // click suppressed
          }
          $scope.$apply(function(){
            $scope.notes.width = $scope.notes.width=='0' && $scope.notes.widthOpen || '0';
          });
        })
        .call(d3.behavior.drag()
          .on('dragstart',function(){
            elm.removeClass('animate');
            x = d3.event.sourceEvent.changedTouches ?  d3.event.sourceEvent.touches[0].clientX : d3.event.sourceEvent.clientX; 
            y = d3.event.sourceEvent.changedTouches ?  d3.event.sourceEvent.touches[0].clientY : d3.event.sourceEvent.clientY - elm.offset().top; 
            offset = elm.outerWidth() - x;
            
          })
          .on('drag', function () {
            
            if(x != d3.event.x && y != d3.event.y){ //fix chrome drag event when click
              $scope.$apply(function(){
                var width = d3.event.x + offset;
                var widthOpen = width;
                if(width < 0){
                  width = '0';
                  widthOpen = '250';
                }
                $scope.notes.width = width;
                $scope.notes.widthOpen = widthOpen;
              });
            }
          })
          .on("dragend", function () {
            elm.addClass('animate');
          })
        );
      }
    };
  });
