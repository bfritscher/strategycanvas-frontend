'use strict';

/**
 * @ngdoc function
 * @name strategycanvasFrontendApp.controller:EditCtrl
 * @description
 * # EditCtrl
 * Controller of the strategycanvasFrontendApp
 */
angular.module('strategycanvasFrontendApp')
  .controller('EditCtrl', function ($scope, $http, $location, $routeParams, $window, $mdDialog, $mdPanel, $mdSidenav, localDS, chart, log, com) {
    //for now keep it local, if global we have to handle unsubscribe of handlers

    $scope.localDS = localDS;
    //TODO change
    $scope.loggedInUser  = loggedInUser;
    //TODO change;
    $scope.baseUri = baseUri;

    $scope.chat = {
      round: {}, //TODO handle cleanup
      messages: [],
      isVisible: false,
      gotNewMsg: false,
      actif: undefined,
      myMsg: '',
      id: 0
    };

    $scope.profile = {
      markerSize: 24 //TODO: save to localstorage or online?
    };

    $scope.locale = {
      chartUntitled: 'Untitled canvas'
    };

    $scope.chart = chart;

    $scope.notes = {
      width: '0',
      widthOpen: 250
    };

    /*
    $scope.connectedChatUsers = function(){
      return 'TODO';
    };

    $scope.notifyChartDescription = function(){
      return 'TODO';
    };

    notifyChartOption
    addSerie
    addFactor
    createNewChart
    grailsEvents.open()
    gotoChart
    sendChatMessage
    businessNotInUse
    factorNotInUse
    */

    $scope.toggleRight = function(){
      $mdSidenav('right').toggle();
    };

    $scope.createNewChart = function createNewChart(){
      $location.replace().path('/edit/new');
    };

    var body = angular.element(document.body);

    $scope.showEditTitle = function showEditTitle($event){
      $mdDialog.show({
        parent: body,
        targetEvent: $event,
        templateUrl: 'editTitle.html',
        controller: function editTitleCtrl($scope, $mdDialog, chartTitle) {
          $scope.chartTitle = chartTitle;
          $scope.save = function() {
            $mdDialog.hide();
            chart.notifyChartOptions({title: $scope.chartTitle});
          };
          $scope.cancel = function() {
            $mdDialog.cancel();
          };
        },
        locals: { chartTitle: $scope.chart.title }
      });
    };

    $scope.showHandbook = function showHandbook($event){
      $mdDialog.show({
        parent: body,
        clickOutsideToClose : true,
        targetEvent: $event,
        templateUrl: 'handbook.html',
        controller: function handbookCtrl($scope, $mdDialog) {
          $scope.close = function () {
            $mdDialog.hide();
          };
          $scope.handbook = {
            urlPrefix : 'views/handbook/',
            pages : [
              {name:'Strategy Canvas', url: 'strategycanvas.html'},
              {name:'Features', url: false},
              {name:'Editing', url:'editing.html'},
              {name:'Collaboration', url:'collaboration.html'},
              {name:'Export', url:'export.html'},
              {name:'iPad / Tablet', url:'ipadtablet.html'},
              {name:'Feedback', url: false},
              {name:'Good, bad, bugs', url:'blank.html'},
              {name:'About', url: false},
              {name:'Who', url:'blank.html'},
              {name:'Privacy', url:'privacy.html'},
            ]
          };
          $scope.handbook.activePage = $scope.handbook.pages[0];
        }
      });
    };

    $scope.showShareDialog = function showShareDialog($event){
      $mdDialog.show({
        parent: body,
        clickOutsideToClose : true,
        targetEvent: $event,
        templateUrl: 'shareDialog.html',
        controller: function shareDialogCtrl($scope, $mdDialog, chart) {
          $scope.chart = chart;
          $scope.baseUri = 'TODO';
          $scope.close = function() {
            $mdDialog.hide();
          };
        },
        onComplete: function(){
          stButtons.makeButtons();
        }
      });
    };


    $scope.showMarkerEditor = function showMarkerEditor($event, serie){
      var beforeChange = serie.color +  serie.symbol + serie.dash;
      var panelPosition = $mdPanel.newPanelPosition()
        .relativeTo($event.target)
        .addPanelPosition('align-start', 'below')
        .withOffsetY('10px');

      var panelAnimation = $mdPanel.newPanelAnimation()
        .openFrom($event.target)
        .withAnimation($mdPanel.animation.SCALE)
        .duration(150)
        .closeTo($event.target);

      $mdPanel.open({
        attachTo: body,
        clickOutsideToClose: true,
        escapeToClose: true,
        focusOnOpen: true,
        hasBackdrop : false,
        position: panelPosition,
        animation: panelAnimation,
        targetEvent: $event,
        templateUrl: 'markerEditor.html',
        controller: function markerEditorCtrl($scope, $mdDialog, dashs, chart, serie, top, left) {
          $scope.markerEditor = {
            serie: serie,
            top: top,
            left: left,
            colors: chart.colors,
            symbols: chart.symbols,
            dashs: dashs
          };
        },
        locals: {
          serie: serie,
          top: $event.clientY + 20,
          left: Math.max(0, $event.clientX - 220)
        }
      })
      .then(null, function() {
        if(beforeChange !==  serie.color +  serie.symbol +  serie.dash){
          //TODO chart.notifySerieChange(serie);
          console.log('changed');
        }
      });
    };

    $scope.showRecentDialog = function showRecentDialog($event){
      $mdDialog.show({
        parent: body,
        clickOutsideToClose : true,
        targetEvent: $event,
        templateUrl: 'recentDialog.html',
        controller: function shareDialogCtrl($scope, $mdDialog, locale, localDS) {
          $scope.localDS = localDS;
          $scope.locale = locale;
          $scope.gotoChart = function(item){
            $mdDialog.hide();
            if(item.editCode){
              $location.path('/edit/' + item.editCode);
            }else{
              $location.path('/' + item.viewCode);
            }
          };

          $scope.close = function() {
            $mdDialog.hide();
          };
        },
        locals: { locale: $scope.locale }
      });
    };

    $scope.showAddDialog = function showAddDialog($event, type){
      $mdDialog.show({
        parent: body,
        clickOutsideToClose : false,
        targetEvent: $event,
        templateUrl: 'addDialog.html',
        onComplete: function(scope, element){
          angular.element(element).find('input').focus();
        },
        controller: function addDialogCtrl($scope, $mdDialog, chart, type) {
          if(type === 'serie'){
            $scope.title = 'Add a new value curve';
            $scope.infoMsg = 'enter one value curve name per line';
            $scope.validate = chart.businessNotInUse;
            $scope.add = function() {
              $mdDialog.hide();
              chart.notifySerieAdd($scope.name);
            };
          }
          if(type === 'factor'){
            $scope.title = 'Add a new factor';
            $scope.infoMsg = 'enter one factor name per line';
            $scope.validate = chart.factorNotInUse;
            $scope.add = function() {
              $mdDialog.hide();
              chart.notifyAddFactor($scope.name);
            };
          }
          $scope.cancel = function() {
            $mdDialog.cancel();
          };
        },
        locals: {type: type}
      });
    };

    $scope.showRemoveDialog = function showRemoveDialog($event, type, data){

      $mdDialog.show({
        parent: body,
        clickOutsideToClose : false,
        targetEvent: $event,
        templateUrl: 'removeDialog.html',
        controller: function addDialogCtrl($scope, $mdDialog, chart, type, data) {
          if(type === 'serie'){
            $scope.title = data.business;
            $scope.name =  data.business;
            $scope.validate = chart.businessNotInUse;
            $scope.remove = function(){
              $mdDialog.hide();
              chart.notifySerieRemove(data);
            };
            $scope.update = function(){
              $mdDialog.hide();
              if( $scope.title !==  $scope.name){
                log.event( 'serie', 'edit', chart.editCode);
                var newSerie = angular.copy(data);
                newSerie.business = $scope.name;
                chart.notifySerieRemove(data);
                chart.notifySerieChange(newSerie)

              }
            };
          }
          if(type === 'factor'){
            $scope.title = data;
            $scope.name = data;
            $scope.validate = chart.factorNotInUse;
            $scope.remove = function(){
              $mdDialog.hide();
              chart.notifyFactorRemove(data);
            };
            $scope.update = function(){
              $mdDialog.hide();
              chart.notifyFactorReplace($scope.title, $scope.name);
            };
          }
          $scope.cancel = function() {
            $mdDialog.cancel();
          };
        },
        locals: {type: type, data: data}
      });
    };



    $scope.showNewCanvasAlert = function($event){
      var confirm = $mdDialog.confirm()
        .parent(body)
        .title('Create a new canvas')
        .content('Do you want to leave this canvas?')
        .ariaLabel('Create a new canvas')
        .ok('Create')
        .cancel('Cancel')
        .targetEvent($event);

      $mdDialog.show(confirm).then(function() {
        log.event( 'chart', 'new', $scope.chart.viewCode);
        $location.path('/edit/new');
      }, function() {
        //log cancel?
      });
    };

    $scope.showCopyCanvasAlert = function($event){
      var confirm = $mdDialog.confirm()
        .parent(body)
        .title('Copy canvas')
        .content('Do you want to copy this canvas?')
        .ariaLabel('Copy canvas')
        .ok('Copy')
        .cancel('Cancel')
        .targetEvent($event);

      $mdDialog.show(confirm).then(function() {
        log.event( 'chart', 'copy', $scope.chart.viewCode);
        //TODO:maybe show spinner
        //FIX: baseUri
        $http({method: 'POST', url: baseUri + 'api/chartcopy', data: {viewCode: $scope.chart.viewCode}})
          .success(function(data, status, headers, config) {
            $location.path('/edit/' + data);
          });
          //TODO: handle error
      }, function() {
        //log cancel?
      });
    };

    $scope.showNotFoundAlert = function($event){
      var confirm = $mdDialog.confirm()
        .parent(body)
        .title('404 Not Found')
        .content('Sorry, but the canvas you were looking for seems not to exist. Do you want to create a new one?')
        .ariaLabel('404 Not Found')
        .ok('Create new canvas')
        .cancel('List recent canvas')
        .targetEvent($event);

      $mdDialog.show(confirm).then(function() {
        $scope.createNewChart();
      }, function() {
        $scope.showRecentDialog($event);
      });
    };

    $scope.showPermissionDeniedAlert = function($event){
      var confirm = $mdDialog.confirm()
        .parent(body)
        .title('Access denied')
        .content('Sorry, you do not seem to have the required permissions to access the requested canvas. Do you want to create a new one?')
        .ariaLabel('Access denied')
        .ok('Create new canvas')
        .cancel('List recent canvas')
        .targetEvent($event);

      $mdDialog.show(confirm).then(function() {
        $scope.createNewChart();
      }, function() {
        $scope.showRecentDialog($event);
      });
    };

    $scope.showDisconnectAlert = function($event){
      var confirm = $mdDialog.alert()
        .parent(body)
        .title('Lost Connection to Server')
        .content('Do you want to try to reconnect? You can also try to reload the page.')
        .ariaLabel('Lost Connection to Server')
        .ok('Retry')
        .targetEvent($event);

      $mdDialog.show(confirm).then(function() {
        //TODO: reconnect
      });
    };

    //GA watch dialog actions
    for(var key in $scope.dialog){
      (function(dialogId){
        $scope.$watch('dialog.' + dialogId, function(value, old){
          if(value !== old){
            if(dialogId === 'remove'){
              dialogId = $scope.temp.remove.type + '_edit';
            }else if(dialogId === 'add'){
              dialogId = 'factor_add';
            }
            else if(dialogId === 'valueCurve'){
              dialogId = 'serie_add';
            }
            else if(dialogId === 'valueCurve'){
              dialogId = $scope.temp.alertdialog.ga;
            }


            var path = $location.path() + '/'+ dialogId +'/';
            if(value){
              $window._gaq.push(['_trackPageview', path + 'open']);
            }else{
              $window._gaq.push(['_trackPageview', path + 'close']);
            }
          }
        });
      })(key);
    }

    $scope.$watch('advancedEntry', function(value, old){
      if(value !== old){
        if(value){
          $window._gaq.push(['_trackPageview', $location.path() + '/'+ $scope.temp.remove.type +'/advanced']);
        }else{
          $window._gaq.push(['_trackPageview', $location.path() + '/'+ $scope.temp.remove.type + '/simple']);
        }
      }
    });

    $scope.$watch('handbook.activePage', function(value, old){
      if(value !== old){
        $window._gaq.push(['_trackPageview', $location.path() + '/handbook/' + $scope.handbook.activePage.url]);
      }
    });

    $scope.$watch('chart', function(chart){
      localDS.touchChart(chart);
    }, true);

    $scope.$watch('dialog.recent', function(value){
      if(value && $scope.loggedInUser){
        $http({method: 'GET', url: baseUri + 'api/usercharts'})
         .success(function(data, status, headers, config) {
           data.forEach(function(item){
             localDS.addItem(item);
             localDS.save();
           });
         });

      }
    });

    $scope.downloadCSV = function downloadCSV(){
      //TODO: handle , ' "
      var table = [['factor\\models']];
      $scope.chart.factors.forEach(function(factor, j){
        table[j+1] = [factor];
        $scope.chart.series.forEach(function(serie, i){
          if(j===0){
            table[0].push(serie.business);
          }
          table[j+1].push(serie.offerings[factor]);
        });
      });


      var csv = table.map(function(row){
        return row.join(',');
      }).join('\n');
      log.pageview({page: $location.path() + '/csv'});
      //TODO: use with server or a:download.click for filename
      $window.open('data:application/octet-stream;charset=utf-8,' + encodeURIComponent(csv));
    };

    $scope.downloadJSON = function downloadJSON(){
      log.pageview({page: $location.path() + '/json'});
      //TODO: use with server or a:download.click for filename
      $window.open('data:application/octet-stream;charset=utf-8,' + encodeURIComponent(JSON.stringify($scope.chart)));
    };

    var doit;
    $(window).resize(function() {
        //$('#mychart').height($(window).height() - $('#legends').outerHeight() - $('header').outerHeight());
        //trigger chart redraw
        clearTimeout(doit);
        doit = setTimeout(function(){
          $scope.$apply(function(){
             $scope.chart.dirty = !$scope.chart.dirty;
            });
        }, 100);
    });

    setTimeout(function(){
      $(window).resize();
    }, 500);
  });
