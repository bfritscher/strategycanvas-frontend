'use strict';

/**
 * @ngdoc directive
 * @name strategycanvasFrontendApp.directive:myMarker
 * @description
 * # myMarker
 */
angular.module('strategycanvasFrontendApp')
  .directive('myMarker', function ($compile) {
    return {
      restrict: 'A',
      templateUrl: 'marker.html',
      replace: true,
      scope: {
        serie:'=serie',
        markerEditor:'=markerEditor'
      },
      link: function($scope, elm, attrs) {
        var beforeChange = '';
        //TODO: editable field in Service?
        if($scope.$parent.chart.editCode){
          elm.clickover({html:true,
            placement:'bottom',
            trigger:'click',
            width: 168, //14*2 + 24*5 + 2*5*2,
            onShown: function(){
              $compile(this.$tip)($scope);
              $scope.$apply(function(){
                $scope.markerEditor.serie = $scope.serie;
                beforeChange = $scope.serie.color + $scope.serie.symbol + $scope.serie.dash;
              });
            },
            onHidden: function(){
              if(beforeChange !== $scope.serie.color + $scope.serie.symbol + $scope.serie.dash){
                //TODO: service would be better
                $scope.$parent.notifySerieChange($scope.serie);
              }
            },
            content:$('#markerEditorhtml').html()});
        }
      }
    };
  });
