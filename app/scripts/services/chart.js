'use strict';

/**
 * @ngdoc service
 * @name strategycanvasFrontendApp.chart
 * @description
 * # chart
 * Service in the strategycanvasFrontendApp.
 */
angular.module('strategycanvasFrontendApp')
  .service('chart', function (log) {
    var self = this;
    /* jshint ignore:start */
    var chart = {"id":159546,"viewCode":"Qj2Ww","editCode":"BQULV880mt","title":"Strategy Canvas: Southwest Airlines","description":"Welcome to StrategyCanvas.org!\n\nThis demo canvas was created for you. You can edit it or start from a new empty canvas by clicking the new document icon.\n\nThis tool helps you design a strategy canvas with value curves like they are proposed by in the Blue Ocean Strategy by W. Chan Kim and Renée Mauborgne (2002, 2005)\n\nFor more explanation, check out the handbook (help icon on top).\n\nIn this sample, you can see that:\n\n\"The strategic profile of Southwest Airlines differs dramatically from those of its competitors in the short-haul airline industry. Note how Southwest’s profile has more in common with the car's than with the profile of other airlines.\" (Harvard Business Review, Vol. 80, No. 6, June 2002)\n\nHINT: Live collaborative editing is supported; just share the link with a colleague!\n","factors":["meals","price","lounges","seating choices","hub connectivity","friendly service","speed","frequent departures"],"series":[{"id":159572,"business":"Car","color":"#7f7f7f","symbol":"circle","dash":"0","offerings":{"frequent departures":1,"speed":0,"hub connectivity":0,"lounges":0,"seating choices":0,"friendly service":0,"meals":0,"price":0.089},"$$hashKey":"017"},{"id":159573,"business":"Other airlines","color":"#e377c2","symbol":"circle","dash":"0","offerings":{"seating choices":0.9301204819277108,"meals":0.5,"hub connectivity":0.52,"speed":0.709,"lounges":0.6,"frequent departures":null,"price":0.671,"friendly service":0.74},"$$hashKey":"01A"},{"id":159571,"business":"Southwest","color":"#7f7f7f","symbol":"circle","dash":"0","offerings":{"price":0.15,"speed":1,"seating choices":0.05,"lounges":0.101,"hub connectivity":0.04,"frequent departures":0.8,"friendly service":0.91,"meals":0.179},"$$hashKey":"01D"}],"lastUpdated":"2015-03-20T09:58:16Z","dirty":false};
    /* jshint ignore:end */
    this.series = chart.series;
    this.factors = chart.factors;
    this.title = chart.title;
    this.description = chart.description;
    this.lastSentChartDescription = chart.description;
    this.editCode = 123;
    this.viewCode = 123;

    this.colors = d3.scale.category10().range();
    this.symbols = d3.svg.symbolTypes;

    this.temp = {
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

    };

    var com = {
      send: function(){}
    };


    var diffMatchPath = new diff_match_patch();
    //https://github.com/bestiejs/lodash/blob/v0.8.2/lodash.js#L3450
    function throttle(func, wait) {
      var args,
          result,
          thisArg,
          timeoutId,
          lastCalled = 0;

      function trailingCall() {
        lastCalled = new Date();
        timeoutId = null;
        result = func.apply(thisArg, args);
      }

      return function() {
        var now = new Date(),
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

    function getUnusedColor(symbol){
      var series = self.series;
      if(symbol){
        series = series.filter(function(serie){
          return serie.symbol === symbol;
        });
      }
      var usedColors =  series.map(function(serie){
        return serie.color;
      });
      for(var i=0; i< self.colors.length; i++){
        var color = self.colors[i];
        if(usedColors.indexOf(color) === -1){
          return color;
        }
      }
    }

    function getUnusedMarker(){
      //first get color across any symbol
      var color = getUnusedColor();
      if(color){
        return {color: color, symbol: self.symbols[0], dash: '0'};
      }
      //for symbol get free color
      for(var i=0; i< self.symbols.length; i++){
        var symbol = self.symbols[i];
        color = getUnusedColor(symbol);
        if(color !== undefined){
          return {color: color, symbol: symbol, dash: '0'};
        }
      }
      //default
      return {color: self.colors[0], symbol:self.symbols[0], dash: '0'};
    }

    function getUniqueName(name, list){
      var count = 1;
      while(list.length > 0 && list.indexOf(name + ' ' + count) > -1){
        count++;
      }
      return name + ' ' + count;
    }

    function updateNextMarker(){
      var marker = getUnusedMarker();
      self.temp.serie.color = marker.color;
      self.temp.serie.symbol = marker.symbol;
      self.temp.serie.dash = marker.dash;
      if(self.series.length === 0){
        self.temp.serie.business = 'Business';
      }else{
        self.temp.serie.business = getUniqueName('Competitor', self.series.map(function(serie){return serie.business;}));
      }
    }
    updateNextMarker();

    function updateNextFactor(){
      self.temp.factor.name = getUniqueName('Factor', self.factors);
    }
    updateNextFactor();

    function moveSerieToTop(serie){
      var index = self.series.indexOf(serie);
      if(index < self.series.length-1){
        self.series.push(self.series.splice(index, 1)[0]);
      }
    }

    function getSerie(name){
      var serie;
      for(var i=0; i < self.series.length; i++){
        serie = self.series[i];
        if(serie.business === name){
          return serie;
        }
      }
      return;
    }

    function getSerieOrCreate(name){
      var serie = getSerie(name);
      if(!serie){
        serie = self.addSerie(name)[0];
      }
      return serie;
    }

    //external operations available on chart
    this.registerCom = function(c){
      com = c;
    };

    this.manualMoveSerieToTop = function(serie){
      moveSerieToTop(serie);
      log.event('serie', 'movetotop', self.viewCode);
    };

    //validators
    this.businessNotInUse = function businessNotInUse(value){
      return self.series.map(function(serie){return serie.business;}).indexOf(value) === -1;
    };

    this.factorNotInUse = function factorNotInUse(value){
        return self.factors.indexOf(value) === -1;
    };

    //update without notifications

    this.setOfferingBySerie = function(serie, factorName, value){
      moveSerieToTop(serie);
      serie.offerings[factorName] = value;
    };

    this.setOfferingByName = function(serieName, factorName, value){
      var serie = getSerieOrCreate(serieName);
      self.setOfferingBySerie(serie, factorName, value);
    };

    //TODO: refator to addSeries + add/updateSerie...
    this.addSerie = function addSerie(name){
      //TODO: refactor to not use temp
      updateNextMarker();
      if(!name){
        name = self.temp.serie.business;
      }
      var lines = name.split(/\r\n|\r|\n/);
      //if we allow choice in future
      var addedSeries = [];
      lines.forEach(function(business){
        if(business !== '' && self.businessNotInUse(business)){
          var serie = getUnusedMarker();
          serie.offerings = {}; //TODO should not be needed
          serie.business = business;
          self.series.push(serie);
          addedSeries.push(serie);
          log.event('serie', 'add', self.editCode);
        }
      });
      return addedSeries;
    };

    this.updateSerie = function updateSerie(data){
      var serie = getSerieOrCreate(data.business);
      angular.extend(serie.offerings, data.offerings);
      serie.color = data.color;
      serie.symbol = data.symbol;
      serie.dash = data.dash;
    };

    this.removeSerie = function removeSerie(serie){
      var index = self.series.indexOf(serie);
      if( index >= 0){
        self.series.splice(index, 1);
      }
    };

    this.removeSerieByName = function removeSerieByName(name){
      self.removeSerie(getSerie(name));
    };


    this.updateFactors = function updateFactors(factors){
      if(self.factors.join('') != factors.join('')){
        self.factors = factors;
      }

    }

    this.removeFactor = function removeFactor(factor){
      self.factors.splice(self.factors.indexOf(factor), 1);
    };

    this.updateChartOptions = function updateChartOptions(options){
      for(var key in options){
        if(['title', 'patches'].indexOf(key) > -1){
          if(key === 'patches'){
            var result = diffMatchPath.patch_apply(diffMatchPath.patch_fromText(options[key]), self.description);
            self.description = result[0];
            self.lastSentChartDescription = self.description;
          }else{
            self[key] = options[key];
          }
        }
      }
    }

    //update with notifications

    //add point to existing serie which has none or create new serie
    this.addOffering = function(factorName, value){
      for(var i=self.series.length-1; i >= 0; i--){
        if(self.series[i].offerings[factorName] === undefined){
          self.notifyOfferingChange(self.series[i], factorName, value);
          log.event('offering', 'add', self.editCode);
          return;
        }
      }
      var series = self.notifySerieAdd();
      log.event('serie', 'autoadd', self.editCode);
      self.notifyOfferingChange(series[0], factorName, value);
      log.event('offering', 'add', self.editCode);
    };

    this.notifyAddFactor = function notifyAddFactor(name){
      var lines = name.split(/\r\n|\r|\n/);
      lines.forEach(function(factor){
        if(factor !== '' && self.factorNotInUse(factor)){
          self.factors.push(factor);
        }
      });
      self.notifyFactorsChange(self.factors);
      //$window._gaq.push(['_trackEvent', 'factor', 'add', $scope.chart.editCode]);
      //TODO move
      setTimeout(function(){
        $('#mychart').animate({'scrollLeft': $('#mychart').width()});
      }, 100);
    };


    this.notifyOfferingChange = function(serie, factor, value){
      self.setOfferingBySerie(serie, factor, value);

      com.send('edit', {
          action: 'offering',
          editCode: self.editCode,
          business: serie.business,
          factor: factor,
          value: value
        });
    };

    this.notifySerieAdd = function(name){
      var addedSeries = self.addSerie(name);
      addedSeries.forEach(function(serie){
        self.notifySerieChange(serie);
      });
      return addedSeries;
    };

    this.notifySerieChange = function notifySerieChange(serie){
      self.updateSerie(serie);
      com.send('edit', {
        action: 'serie',
        editCode: self.editCode,
        business: serie.business,
        color: serie.color,
        symbol: serie.symbol,
        dash: serie.dash,
        offerings: serie.offerings
        });
      //$window._gaq.push(['_trackEvent', 'serie', 'edit', $scope.chart.editCode]);
    };

    this.notifySerieRemove = function(serie){
      self.removeSerie(serie);
      log.event( 'serie', 'remove', self.editCode);
      com.send('edit', {
          action: 'serieRemove',
          editCode: self.editCode,
          business: serie.business
        });
    };

    this.notifyFactorRemove = function notifyFactorRemove(factor){
      self.removeFactor(factor);
      self.notifyFactorsChange(self.factors);
      log.event( 'factor', 'remove', self.editCode);
    }

    this.notifyFactorsChange = function(factors){
      self.factors = factors;
      com.send('edit', {
        action: 'factors',
          editCode: self.editCode,
          factors: factors
        });
    };

    this.notifyFactorReplace = function(oldFactor, factor){
      if( factor !==  oldFactor){
        self.factors[self.factors.indexOf(oldFactor)] = factor;
        self.notifyFactorsChange(self.factors);
        log.event( 'factor', 'edit', self.editCode);
        //copy offerings
        //hate side effect...
        var localseries = self.series.slice(0);
        for(var i=0; i < localseries.length;i++){
          var serie = localseries[i];
          if(serie.offerings.hasOwnProperty(oldFactor)){
            //TODO: fix bug of side effects of reordering series
            self.notifyOfferingChange(serie, factor, serie.offerings[oldFactor]);
          }
        }
      }
    };

    this.notifyChartOptions = function(options){
      this.updateChartOptions(options);
      com.send('edit', {
        action: 'chart',
          editCode: self.editCode,
          options: options
        });
      //$window._gaq.push(['_trackEvent', 'chart', 'title', $scope.chart.editCode]);
    };

    var notifyChartDescription = function(){
      var  patches = diffMatchPath.patch_toText(diffMatchPath.patch_make(self.lastSentChartDescription, self.description));
      self.lastSentChartDescription = self.description;
      com.send('edit', {
        action: 'chart',
          editCode: self.editCode,
          options: {patches: patches}
        });
      //$window._gaq.push(['_trackEvent', 'chart', 'description', $scope.chart.editCode]);
    };

    this.notifyChartDescription = throttle(notifyChartDescription, 1500);


/*
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


*/
  });
