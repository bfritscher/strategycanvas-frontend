'use strict';

/**
 * @ngdoc function
 * @name strategycanvasFrontendApp.controller:EditCtrl
 * @description
 * # EditCtrl
 * Controller of the strategycanvasFrontendApp
 */
angular.module('strategycanvasFrontendApp')
  .controller('EditCtrl', function ($scope, dashs, $http, $location, $routeParams, $window, $mdDialog, $mdSidenav, localDS, chart ) {
    //for now keep it local, if global we have to handle unsubscribe of handlers
    
    $scope.localDS = localDS;
    //TODO change
    $scope.loggedInUser  = loggedInUser;
    //TODO change;
    $scope.baseUri = baseUri;
       
    $scope.markerEditor = {
      serie: undefined,
      top:0,
      left:0,
      colors: chart.colors,
      symbols: chart.symbols,
      dashs: dashs  
    };
    
    $scope.chat = {
      round: {}, //TODO handle cleanup
      messages: [],
      isVisible: false,
      gotNewMsg: false,
      actif: undefined,
      myMsg: '',
      id: 0
    };
    
    //dialog states
    $scope.dialog = {
      valueCurve: false,
      remove: false,
      add: false,
      //recent: false,
      //disconnected: false,
      //notfound: false,
      //permissiondenied: false,
      login: false
    };
    
    $scope.profile = {
      markerSize: 24 //TODO: save to localstorage or online?
    };
    
    $scope.locale = {
      chartUntitled: 'Untitled canvas'
    };
      
    $scope.chart = chart;
    
    //to handle cancel in dialog
    $scope.temp = {
      chartTitle: '',
      serie: {
        business: '',
        color: '',
        symbol: '',
        dash: '0',
        offerings: {}
      },
      factor:{
        name: ''
      },
      remove: {
        name: null,
        action: null,
        data: null
      }
    };
    
    $scope.notes = {
      width: '0',
      widthOpen: 250
    };

    /*    
    $scope.connectedChatUsers = function(){
      return 'TODO';
    };
    
    $scope.manualMoveSerieToTop = function(){
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
    
    var body = angular.element(document.body);
    
    $scope.showEditTitle = function showEditTitle($event){
      $mdDialog.show({
        parent: body,
        targetEvent: $event,
        templateUrl: 'editTitle.html',
        controller: function editTitleCtrl($scope, $mdDialog, chartTitle) {
          $scope.chartTitle = chartTitle;
          $scope.save = function() {
            $mdDialog.hide($scope.chartTitle);
          };
          $scope.cancel = function() {
            $mdDialog.cancel();
          };
        },
        locals: { chartTitle: $scope.chart.title }
      })
      .then(function(chartTitle){
        $scope.chart.title = chartTitle;
      });
    };
    
    $scope.showHandbook = function showHandbook($event){
      $mdDialog.show({
        parent: body,
        clickOutsideToClose : true,
        targetEvent: $event,
        templateUrl: 'handbook.html',
        controller: function handbookCtrl($scope, $mdDialog) {
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
       
    $scope.showValueCurveDialog = function showValueCurveDialog(){
      $scope.dialog.valueCurve = true;
    };
    
    $scope.showRemoveDialog = function showRemoveDialog(type, data){
      $scope.temp.remove.type = type;
      if(type === 'serie'){
        $scope.temp.remove.name =  data.business;
        $scope.temp.remove.newname =  data.business;
        $scope.temp.remove.remove = function(){
          $scope.dialog.remove = false;
          $scope.notifySerieRemove(data);
          $window._gaq.push(['_trackEvent', 'serie', 'remove', $scope.chart.editCode]);
        };
        $scope.temp.remove.update = function(){
          $scope.dialog.remove = false;
          if( $scope.temp.remove.newname !=  $scope.temp.remove.name){
            $window._gaq.push(['_trackEvent', 'serie', 'edit', $scope.chart.editCode]);
            var newSerie = angular.copy(data);
            newSerie.business = $scope.temp.remove.newname;
            $scope.notifySerieRemove(data);
            //if using a name that exist remove old serie
            var index = $scope.chart.series.map(function(serie){return serie.business;}).indexOf(newSerie.business);
            if(index > -1){
               $scope.chart.series.splice(index, 1);
            }
            $scope.chart.series.push(newSerie);
            $scope.notifySerieChange(newSerie);
            
          }
        };
      }else if(type === 'factor'){
        $scope.temp.remove.name =  data;
        $scope.temp.remove.newname =  data;
        $scope.temp.remove.remove = function(){
          $scope.dialog.remove = false;
          $scope.removeFactor(data);
          $window._gaq.push(['_trackEvent', 'factor', 'remove', $scope.chart.editCode]);
        };
        $scope.temp.remove.update = function(){
          $scope.dialog.remove = false;
          //TODO better data structure for factors
          var factor = $scope.temp.remove.newname,
          oldFactor = $scope.temp.remove.name; 
          if( factor !=  oldFactor){
            $window._gaq.push(['_trackEvent', 'factor', 'edit', $scope.chart.editCode]);
            $scope.chart.factors[$scope.chart.factors.indexOf(oldFactor)] = factor;
            $scope.notifyFactorsChange($scope.chart.factors);
            //copy offerings
            //hate side effect...
            var localseries = $scope.chart.series.slice(0);
            for(var i=0; i < localseries.length;i++){
              var serie = localseries[i];
              if(serie.offerings.hasOwnProperty(oldFactor)){
                //TODO: fix bug of side effects of reordering series
                $scope.notifyOfferingChange(serie, factor, serie.offerings[oldFactor]);
              }
            }
          }
        };
      }else{
        return
      }
      
      $scope.dialog.remove = true;
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
        $window._gaq.push(['_trackEvent', 'chart', 'new', $scope.chart.viewCode]);
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
        $window._gaq.push(['_trackEvent', 'chart', 'copy', $scope.chart.viewCode]);
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
        //TODO createNewChart()
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
        //TODO createNewChart()
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
   
    
    /*

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
    
    $scope.$watch('chat.isVisible', function(value, old){
      if(value !== old){
        if(value){
          $window._gaq.push(['_trackPageview', $location.path() + '/chat/open']);
        }else{
          $window._gaq.push(['_trackPageview', $location.path() + '/chat/close']);
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
    
    */
        
    $scope.downloadCSV = function downloadCSV(){
      //TODO: handle , ' "
      var table = [['factor\\models']];
      $scope.chart.factors.forEach(function(factor, j){
        table[j+1] = [factor];
        $scope.chart.series.forEach(function(serie, i){
          if(j==0){
            table[0].push(serie.business);		
          }
          table[j+1].push(serie.offerings[factor]);
        });
      });
      
      
      var csv = table.map(function(row){
        return row.join(',');
      }).join("\n");
      $window._gaq.push(['_trackPageview', $location.path() + '/csv']);
      //TODO: use with server or a:download.click for filename 
      window.open("data:application/octet-stream;charset=utf-8," + encodeURIComponent(csv));
    };
    
    $scope.downloadJSON = function downloadJSON(){
      $window._gaq.push(['_trackPageview', $location.path() + '/json']);
      //TODO: use with server or a:download.click for filename 
      window.open("data:application/octet-stream;charset=utf-8," + encodeURIComponent(JSON.stringify($scope.chart)));
    };
    
    //watch to lazy too make directives/components just for that
    //always show last message at the bottom
    $scope.$watch('chat.messages',function(){
      //hack wait for ng-each :-(?
      setTimeout(function(){
        $('#chat-content').scrollTop($('#chat-content').height());
      }, 100);
            
    }, true);
    var doit;
    $(window).resize(function() {
        //$('#chat-content').height($(window).height()-117-$('#legends').offset().top);
        $('#mychart').height($(window).height() - $('#legends').outerHeight() - $('header').outerHeight());

                
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
