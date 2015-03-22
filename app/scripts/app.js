'use strict';

/**
 * @ngdoc overview
 * @name strategycanvasFrontendApp
 * @description
 * # strategycanvasFrontendApp
 *
 * Main module of the application.
 */

angular
  .module('strategycanvasFrontendApp', [
    'ngAnimate',
    'ngCookies',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngMaterial'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/:viewCode', {
        templateUrl: 'views/edit.html',
        controller: 'EditCtrl'
      })
      .when('/edit/:editCode', {
        templateUrl: 'views/edit.html',
        controller: 'EditCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(['$window', '$location', '$rootScope', 'localDS', function($window, $location, $rootScope, localDS){
      $rootScope.$on('$routeChangeSuccess', function(){
        var path = $location.path();
        $window.ga('send', 'pageview', {'page': path});
        if(path === '/'){
          var lastOpen = localDS.lastOpen();
          if(lastOpen){
            if(lastOpen.edit){
              $location.replace().path('/edit/' + lastOpen.code);
            }else{
              $location.replace().path('/' + lastOpen.code);
            }
          }else{
            $location.replace().path('/edit/new0');
          }
        }
      });
  }]);
//fix svg bind bug https://github.com/angular/angular.js/issues/1050
angular.forEach(['d'], function(name) {
  var ngName = 'ng' + name[0].toUpperCase() + name.slice(1);
  angular.module('strategycanvasFrontendApp').directive(ngName, function() {
    return function(scope, element, attrs) {
      attrs.$observe(ngName, function(value) {
        attrs.$set(name, value); 
      });
    };
  });
});  