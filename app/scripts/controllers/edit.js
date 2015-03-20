'use strict';

/**
 * @ngdoc function
 * @name strategycanvasFrontendApp.controller:EditCtrl
 * @description
 * # EditCtrl
 * Controller of the strategycanvasFrontendApp
 */
angular.module('strategycanvasFrontendApp')
  .controller('EditCtrl', function ($scope, dashs, $http, $location, $routeParams, $window, localDS) {
    //for now keep it local, if global we have to handle unsubscribe of handlers
    
    //TODO change
    $scope.grailsEvents = new grails.Events(baseUri, {
      onError: function(response){
        $scope.dialog.disconnected = true;
      }
    });
    $scope.grailsEvents.onopen = function(){
      $scope.$apply(function(){
        $scope.dialog.disconnected = false;
      });
    };
     
    $scope.localDS = localDS;
    //TODO change
    $scope.loggedInUser  = loggedInUser ; 
     
    var diffMatchPath = new diff_match_patch();
     
    //bug cleanup
    $('.modal-backdrop').remove(); 
       
    //handbook data
    $scope.handbook = {
      urlPrefix : baseUri + 'partials/handbook/',
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
     
    //TODO change;
    $scope.baseUri = baseUri;
     
    $scope.markerEditor = {
      serie: undefined,
      top:0,
      left:0,
      colors: d3.scale.category10().range(),
      symbols: d3.svg.symbolTypes,
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
      editTitle: false,
      valueCurve: false,
      remove: false,
      notfound: false,
      share: false,
      handbook: false,
      add: false,
      disconnected: false,
      alert: false,
      recent: false,
      permissiondenied: false,
      login: false
    };
    
    $scope.profile = {
      markerSize: 24 //TODO: save to localstorage or online?
    };
    
    $scope.locale = {
      chartUntitled: 'Untitled canvas'
    };
      
    $scope.chart = {
      factors : [],
      series : [],
    };
    
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
      },
      alertdialog:{
        title: '',
        ok: '',
        msg: '',
        ga: '', //google analytics label
        action: null
      }
    };
    
    $scope.notes = {
      width: '0',
      widthOpen: 250
    };
      
    //LoadChart
    $http({method: 'POST', url: baseUri + 'api/chartjson', data: {viewCode: $routeParams.viewCode, editCode: $routeParams.editCode}})
      .success(function(data, status, headers, config) {
          if($routeParams.editCode && $routeParams.editCode != data.editCode && data.editCode){
            //close all dialogs first because of aterfacts
            $location.replace().path('/edit/' + data.editCode);
            return;
          }
          
          //TODO move chat to seperate controller?
        $(window).on('beforeunload', function(){
          $scope.grailsEvents.send('chat', {
            viewCode: $scope.chart.viewCode,
              action: 'disconnected',
              id: $scope.chat.id
            });
        });
          
            $scope.grailsEvents.on('chat_' + data.viewCode, function(data){
            if(data.action=="connected"){
              $scope.$apply(function(){
                $scope.chat.round[data.round] = {};
                $scope.chat.id = $scope.grailsEvents.globalTopicSocket.request.localId;
                $scope.grailsEvents.send('chat', {
                  action: 'me',
                  round: data.round,
                  edit: $scope.chart.editCode != undefined,
                  name: $scope.loggedInUser ? $scope.loggedInUser.username : undefined,
                  viewCode: $scope.chart.viewCode,
                    id: $scope.chat.id //TODO: should use better id
                  });
              });
            }
            else if(data.action=="me"){
              $scope.$apply(function(){
                if(data.id == $scope.chat.id){
                  data.name = "me";
                }
                if(data.name == undefined){
                  data.name = 'Anonymous User ' + data.id.slice(0,2);
                }
                if(!$scope.chat.round[data.round]){
                  $scope.chat.round[data.round] = {};
                }
                $scope.chat.round[data.round][data.id] = {id: data.id, name: data.name, edit: data.edit};	 
                //TODO choose by date + cleanup
                $scope.chat.actif = data.round;
              });
            }else if(data.action=="disconnected"){
              $scope.$apply(function(){
                if ($scope.chat.actif && $scope.chat.round[$scope.chat.actif].hasOwnProperty(data.id)){
                  delete $scope.chat.round[$scope.chat.actif][data.id];
                  $scope.chat.messages.push({user:$scope.lookupChatUser(data.id), text:'has left', type:'status'});
                }
              });
            }else if(data.action=="msg"){
              $scope.$apply(function(){
                $scope.chat.messages.push({user:$scope.lookupChatUser(data.id), text:data.msg, type:'msg'});
                if(!$scope.chat.isVisible){
                  $scope.chat.gotNewMsg = true;
                }
              });
            }
          });
          
          $scope.grailsEvents.send('chat', {
            viewCode: data.viewCode,
              action: 'connected',
              round: Math.random()
            });

          //subscribe to edit notifications
          
            $scope.grailsEvents.on('edit_' + data.viewCode, function(data){
              $scope.$apply(function(){
                switch(data.action){
                  case 'offering':
                    var serie = $scope.getSerieByBusiness(data.business);
                    $scope.setOffering(serie, data.factor, data.value);
                    break;
                  case 'factors':
                    if($scope.chart.factors.join('') != data.factors.join('')){
                      $scope.remoteUpdate = true; 
                      $scope.chart.factors = data.factors;
                      //update add offerings
                      if(data.offerings){
                        $scope.chart.series.forEach(function(serie){
                          if(data.offerings.hasOwnProperty(serie.business)){
                            serie.offerings[serie.business] = data.offerings[serie.business];
                          }
                        });
                      }
                    }
                    break;
                  case 'serie':
                    var serie = $scope.getSerieByBusiness(data.business);
                    angular.extend(serie.offerings, data.offerings);
                    data.offerings;
                    //merge offerings
                    
                      
                      serie.color = data.color;
                    serie.symbol = data.symbol;
                    serie.dash = data.dash;
                    break;
                  case 'serieRemove':
                    var serie = $scope.getSerieByBusiness(data.business);
                    $scope.removeSerie(serie);
                    break;
                  case 'chart':
                    if(data.localId ==  $scope.grailsEvents.globalTopicSocket.request.localId) return;
                    for(var key in data.options){
                      if(data.options.hasOwnProperty(key)){
                        if(key === 'patches'){
                          var result = diffMatchPath.patch_apply(diffMatchPath.patch_fromText(data.options[key]), $scope.chart.description);
                          $scope.chart.description = result[0];
                          $scope.temp.lastSentChartDescription = $scope.chart.description;
                          
                        }else{
                          $scope.chart[key] = data.options[key];
                        }
                      }
                    }
                    break;
                }
              });
            });
            
          //all ready, apply loaded data
        $scope.chart = data; 
        if($scope.chart.title === 'Strategy Canvas: Southwest Airlines'){
          $scope.notes.width = 250;
        }
        $scope.temp.lastSentChartDescription = $scope.chart.description;
      })
      .error(function(data, status, headers, config) {
          if(status === 404){
            $scope.dialog.notfound = true;
          }else if(status === 403){
            if($scope.loggedInUser){
              $scope.dialog.permissiondenied = true;
            }else{
              $scope.dialog.login = true;
            }
          }
      });
   

   
    $scope.loginWith = function(provider){
      $window.location = baseUri + 'oauth/' + provider + '/authenticate';
    };
    
    $scope.logout = function(provider){
      $window.location = baseUri + 'logout';
    };
    
    $scope.getSerieByBusiness = function(business){
      var serie;
      for(var i=0; i < $scope.chart.series.length; i++){
        serie = $scope.chart.series[i];
        if(serie.business == business) return serie;
      }
      serie = {business: business, offerings:{}};
      //TODO: not good to go outside
      $scope.chart.series.push(serie);
      return serie;
    };
    
    $scope.lookupChatUser = function(id){
      if($scope.chat.round[$scope.chat.actif].hasOwnProperty(id)){
        return $scope.chat.round[$scope.chat.actif][id];
      }
      return {name: 'Anonymous User'};
    };
    
    $scope.connectedChatUsers = function(){
      return $scope.chat.round[$scope.chat.actif] ? Object.keys($scope.chat.round[$scope.chat.actif]).length-1 : 0;
    };
    
    $scope.sendChatMessage = function($event){
      if(navigator.userAgent.match(/iPad/i) != null){
        $event.target.blur();	
      }
      $event.preventDefault();
      $scope.grailsEvents.send('chat', {
        action: 'msg',
        msg: $scope.chat.myMsg,
        viewCode: $scope.chart.viewCode,
          id: $scope.chat.id //TODO: should use better id
        });
      
      $window._gaq.push(['_trackEvent', 'chat', 'msg', $scope.chart.viewCode, $scope.chat.myMsg.length]);
      
      $scope.chat.myMsg = "";
    };
    
    $scope.notifyOfferingChange = function(serie, factor, value){
      $scope.setOffering(serie, factor, value);
      $scope.grailsEvents.send('edit', {
        action: 'offering',
          editCode: $scope.chart.editCode,
          business: serie.business,
          factor: factor,
          value: value
        });
    };
    
    $scope.notifyFactorsChange = function(factors){
      $scope.chart.factors = factors;
      $scope.grailsEvents.send('edit', {
        action: 'factors',
          editCode: $scope.chart.editCode,
          factors: factors
        });
    };
    
    $scope.notifySerieRemove = function(serie){
      $scope.removeSerie(serie);
      $scope.grailsEvents.send('edit', {
        action: 'serieRemove',
          editCode: $scope.chart.editCode,
          business: serie.business
        });
    };
    
    $scope.notifyChartOption = function(){
      $scope.chart.title = $scope.temp.chartTitle;
      $scope.dialog.editTitle = false;
      $scope.grailsEvents.send('edit', {
        action: 'chart',
          editCode: $scope.chart.editCode,
          options: {title : $scope.chart.title}
        });
      $window._gaq.push(['_trackEvent', 'chart', 'title', $scope.chart.editCode]);
    };
    
    var notifyChartDescription = function(){
      if($scope.chart.editCode){
        var  patches = diffMatchPath.patch_toText(diffMatchPath.patch_make($scope.temp.lastSentChartDescription, $scope.chart.description));
        $scope.temp.lastSentChartDescription = $scope.chart.description;
        $scope.grailsEvents.send('edit', {
          action: 'chart',
            editCode: $scope.chart.editCode,
            options: {patches: patches}
          });
      }
      $window._gaq.push(['_trackEvent', 'chart', 'description', $scope.chart.editCode]);
    };
    
    $scope.notifyChartDescription = throttle(notifyChartDescription, 1500);
    
    $scope.setOffering = function(serie, factor, value){
      $scope.moveSerieToTop(serie);
      setTimeout(function(){
        $scope.$apply(function(){
          serie.offerings[factor] = value;
        });
      },100);
    };
    
    $scope.addFactor = function addFactor(){
      $scope.dialog.add = false;
      var lines = $scope.temp.factor.name.split(/\r\n|\r|\n/);
      lines.forEach(function(factor){
        if(factor != "" && $scope.factorNotInUse(factor)){
          $scope.chart.factors.push(factor);
          $scope.notifyFactorsChange($scope.chart.factors);
        }
      });
      $window._gaq.push(['_trackEvent', 'factor', 'add', $scope.chart.editCode]);
      //dom :-(
      setTimeout(function(){
        $('#mychart').animate({'scrollLeft': $('#mychart').width()});
      }, 100);
    };
    
    $scope.removeFactor = function removeFactor(factor){
      $scope.chart.factors.splice($scope.chart.factors.indexOf(factor), 1);
      $scope.notifyFactorsChange($scope.chart.factors);
    };
    
    //TODO: refactor
    $scope.addSerie = function addSerie(){
      $scope.dialog.valueCurve = false;
      var lines = $scope.temp.serie.business.split(/\r\n|\r|\n/);
      //if we allow choice in future
      var serie = {color: $scope.temp.serie.color,
           symbol:$scope.temp.serie.symbol,
           dash: $scope.temp.serie.dash, offerings:{}};
      var addedSeries = [];
      lines.forEach(function(business){
        if(business != "" && $scope.businessNotInUse(business)){
          serie.business = business;
          $scope.chart.series.push(serie);
          addedSeries.push(serie);
          $scope.notifySerieChange(serie);
          serie = getUnusedMarker();
          serie.offerings = {}; //TODO should not be needed
        }
      });
      $window._gaq.push(['_trackEvent', 'serie', 'add', $scope.chart.editCode]);
      
      return addedSeries;
    };
    
    $scope.notifySerieChange = function notifySerieChange(serie){
      $scope.grailsEvents.send('edit', {
        action: 'serie',
          editCode: $scope.chart.editCode,
          business: serie.business,
          color: serie.color,
        symbol: serie.symbol,
        dash: serie.dash,
        offerings: serie.offerings
        });
      $window._gaq.push(['_trackEvent', 'serie', 'edit', $scope.chart.editCode]);
    };
    
    $scope.removeSerie = function removeSerie(serie){
      $scope.moveSerieToTop(serie);
      setTimeout(function(){
        $scope.$apply(function(){
          var index = $scope.chart.series.indexOf(serie); 
          if( index >= 0){
            $scope.chart.series.splice(index, 1);
          }
        });
      },100);
    };
    
    $scope.createNewChart = function createNewChart(){
      $scope.dialog.notfound = false;
      $scope.dialog.permissiondenied = false;
      $location.replace().path('/edit/new');
    };
    
    $scope.copyExample = function(){
      $location.replace().path('/edit/new0');
    };
    
    $scope.manualMoveSerieToTop = function(serie){
      $scope.moveSerieToTop(serie);
      $window._gaq.push(['_trackEvent', 'serie', 'movetotop', $scope.chart.viewCode]);
    };
    
    $scope.moveSerieToTop = function moveSerieToTop(serie){
      var index = $scope.chart.series.indexOf(serie);
      if(index < $scope.chart.series.length-1){
        $scope.chart.series.push($scope.chart.series.splice(index, 1)[0]);
      }
    };
    
    $scope.showSupport = function($event){
      $event.stopPropagation();
      $event.preventDefault();
      
      $window._gaq.push(['_trackPageview', $location.path() + '/support']);
    };
    
    $scope.showEditTitle = function showEditTitle(){
      $scope.temp.chartTitle = $scope.chart.title;
      $scope.dialog.editTitle = true;
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
    
    $scope.showNewCanvasAlert = function(){
      $scope.temp.alertdialog.title = "Create new canvas";
      $scope.temp.alertdialog.ok = "Create";
      $scope.temp.alertdialog.ga = "new";
      $scope.temp.alertdialog.msg = "Do you want to leave this canvas?";
      $scope.temp.alertdialog.action = function(){
        $scope.dialog.alert = false;
        $window._gaq.push(['_trackEvent', 'chart', 'new', $scope.chart.viewCode]);
        $location.path('/edit/new');
      };
      $scope.dialog.alert = true;
    };
    
    $scope.showCopyCanvasAlert = function(){
      $scope.temp.alertdialog.title = "Copy canvas";
      $scope.temp.alertdialog.ok = "Copy";
      $scope.temp.alertdialog.ga = "copy";
      $scope.temp.alertdialog.msg = "Do you want to copy this canvas?";
      
      $scope.temp.alertdialog.action = function(){
        $scope.dialog.alert = false;
        $window._gaq.push(['_trackEvent', 'chart', 'copy', $scope.chart.viewCode]);
        //TODO:maybe show spinner
        $http({method: 'POST', url: baseUri + 'api/chartcopy', data: {viewCode: $scope.chart.viewCode}})
          .success(function(data, status, headers, config) {
            $location.path('/edit/' + data);
          });
          //TODO: handle error
      };
      $scope.dialog.alert = true;
    };
    
    $scope.gotoChart = function(item){
      $scope.dialog.recent = false;
      if(item.editCode){
        $location.path('/edit/' + item.editCode);	
      }else{
        $location.path('/' + item.viewCode);
      }
    };
    
    
    $scope.businessNotInUse = function businessNotInUse(value){
        return $scope.chart.series.map(function(serie){return serie.business;}).indexOf(value) === -1;
    };
    
    $scope.factorNotInUse = function factorNotInUse(value){
        return $scope.chart.factors.indexOf(value) === -1;
    };
    
    function getUnusedMarker(){
      //first get color across any symbol
      var color = getUnusedColor();
      if(color){
        return {color: color, symbol: $scope.markerEditor.symbols[0], dash: '0'};
      }
      //for symbol get free color
      for(var i=0; i< $scope.markerEditor.symbols.length; i++){
        var symbol = $scope.markerEditor.symbols[i];
        var color = getUnusedColor(symbol);
        if(color != undefined){
          return {color: color, symbol: symbol, dash: '0'};
        }
      }
      //default
      return {color: $scope.markerEditor.colors[0], symbol:$scope.markerEditor.symbols[0], dash: '0'};
    }
    
    function getUnusedColor(symbol){
      var series = $scope.chart.series;
      if(symbol){
        series = series.filter(function(serie){ serie.symbol === symbol; });
      }
      var usedColors =  series.map(function(serie){return serie.color;});
      for(var i=0; i< $scope.markerEditor.colors.length; i++){
        var color = $scope.markerEditor.colors[i];
        if(usedColors.indexOf(color) == -1){
          return color;
        }
      }
    }
    
    //GA watch
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
    
    function getUniqueName(name, list){
      var count = 1;
      while(list.length > 0 && list.indexOf(name + ' ' + count) > -1){
        count++;
      }
      return name + ' ' + count;
    }
    
    
    //https://github.com/bestiejs/lodash/blob/v0.8.2/lodash.js#L3450
      function throttle(func, wait) {
          var args,
              result,
              thisArg,
              timeoutId,
              lastCalled = 0;

          function trailingCall() {
            lastCalled = new Date;
            timeoutId = null;
            result = func.apply(thisArg, args);
          }

          return function() {
            var now = new Date,
                remain = wait - (now - lastCalled);

            args = arguments;
            thisArg = this;

            if (remain <= 0) {
              clearTimeout(timeoutId);
              lastCalled = now;
              result = func.apply(thisArg, args);
            }
            else if (!timeoutId) {
              timeoutId = setTimeout(trailingCall, remain);
            }
            return result;
          };
        }
    
      
    $scope.$watch('chart', function(chart){
      localDS.touchChart(chart);
    }, true);
      
    //TODO target markers more precisely
    $scope.$watch('chart.series', function(){
      var marker = getUnusedMarker();
      $scope.temp.serie.color = marker.color;
      $scope.temp.serie.symbol = marker.symbol;
      $scope.temp.serie.dash = marker.dash;
      if($scope.chart.series.length ==0){
        $scope.temp.serie.business = 'Business';
      }else{
        $scope.temp.serie.business = getUniqueName('Competitor', $scope.chart.series.map(function(serie){return serie.business;}));	
      }
      
    }, true);
    
    $scope.$watch('chart.factors', function(){
      $scope.temp.factor.name = getUniqueName('Factor', $scope.chart.factors);
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
        $('#chat-content').height($(window).height()-117-$('#legends').offset().top);
        $('#mychart').height($(window).height() - $('#legends').outerHeight() - $('#header').outerHeight());
        $('#description .description-text').height($(window).height()-$('#mychart').offset().top -20);

        //fix handbook dialog height 56 + 60 + 60 + 60
        $('#handbook .modal-body').height($(window).height()-260);
        
        
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
