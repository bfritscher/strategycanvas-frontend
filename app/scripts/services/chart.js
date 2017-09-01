'use strict';

/**
 * @ngdoc service
 * @name strategycanvasFrontendApp.chart
 * @description
 * # chart
 * Service in the strategycanvasFrontendApp.
 */
angular.module('strategycanvasFrontendApp')
  .service('chart', function (log, $window, com) {
    var self = this;

    this.series = [];
    this.factors = [];
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

    var diffMatchPath;
    /* jshint ignore:start */
    diffMatchPath = new diff_match_patch();
    /* jshint ignore:end */
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
      if(self.factors.join('') !== factors.join('')){
        self.factors = factors;
      }

    };

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
    };

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
      $window._gaq.push(['_trackEvent', 'factor', 'add', self.chart.editCode]);
      //TODO move
      setTimeout(function(){
        $('#mychart').animate({'scrollLeft': $('#mychart').width()});
      }, 100);
    };


    this.notifyOfferingChange = function(serie, factor, value){
      self.setOfferingBySerie(serie, factor, value);
      com.offerings.patch(
        null,
        {
          value: value || null
        },
        {
          query: {
            edit_code: self.editCode,
            factor: factor,
            business: serie.business
          }
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
      $window._gaq.push(['_trackEvent', 'serie', 'edit', self.editCode]);
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
    };

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
      $window._gaq.push(['_trackEvent', 'chart', 'title', self.editCode]);
    };

    var notifyChartDescription = function(){
      var  patches = diffMatchPath.patch_toText(diffMatchPath.patch_make(self.lastSentChartDescription, self.description));
      self.lastSentChartDescription = self.description;
      com.send('edit', {
        action: 'chart',
          editCode: self.editCode,
          options: {patches: patches}
        });
      $window._gaq.push(['_trackEvent', 'chart', 'description', self.editCode]);
    };

    this.notifyChartDescription = throttle(notifyChartDescription, 1500);


    this.loadChart = function() {
      return com.loadChart(this).then(function(chart){
        console.log(chart);
        if (chart) {
          self.series = chart.series;
          self.factors = chart.factors;
          self.title = chart.title;
          self.description = chart.description;
          self.lastSentChartDescription = chart.description;
          self.editCode = chart.edit_code;
          self.viewCode = chart.view_code;
        }
      });
    };
  });
