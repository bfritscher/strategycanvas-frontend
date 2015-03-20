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
    'ngTouch'
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
/*
  .value('ui.config', {
    // The ui-jq directive namespace
     jq: {
        // The Tooltip namespace
        tooltip: {
           // Tooltip options. This object will be used as the defaults
           placement: 'bottom',
           
        }
     }
  })
*/
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
