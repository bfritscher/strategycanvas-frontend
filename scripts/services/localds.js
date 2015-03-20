'use strict';

/**
 * @ngdoc service
 * @name strategycanvasFrontendApp.localDS
 * @description
 * # localDS
 * Factory in the strategycanvasFrontendApp.
 */
angular.module('strategycanvasFrontendApp')
  .factory('localDS', function () {
    var KEY = 'appdata';
    var appDataJson = localStorage.getItem(KEY);
    var appData = {};
    if(appDataJson){
      try{
        var dateReviver = function dateReviver(key, value) {
            var a;
            if (typeof value === 'string') {
                a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                if (a) {
                    return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                                    +a[5], +a[6]));
                }
            }
            return value;
        };
        
         appData = JSON.parse(appDataJson, dateReviver);
      }catch(e){
        
      }
    }
    if(appData.version !== 1){
      appData.version = 1;
      appData.charts = [];
    }
    
    appData.touchChart = function(chart){
      if(chart.viewCode){
        var i = appData.indexOf(chart);
        var item;
        if(i === -1){
          item = {};
          appData.charts.push(item);
        }else{
          item = appData.charts[i];
        }
        angular.extend(item, appData.chartToItem(chart));
        appData.save();
      }
    };
    
    appData.addItem = function(item){
      if(appData.indexOf(item) === -1){
        appData.charts.push(item);
      }
    };
    
    appData.chartToItem = function(chart){
      var item = {viewCode: chart.viewCode, title:chart.title, timestamp: new Date()};
      if(chart.editCode){
        item.editCode = chart.editCode; 
      }
      return item;
    };
    
    //if not found returns length of array to be used as insert point
    appData.indexOf = function(chart){
      for(var i=0; i< appData.charts.length; i++){
        if(appData.charts[i].viewCode === chart.viewCode){
          return i;
        }
      }
      return -1;
    };
    
    appData.save = function(){
      try{
        appData.charts.sort(function(a, b){
          return b.timestamp - a.timestamp;
        });
        localStorage.setItem(KEY, JSON.stringify(appData));
      }catch(e){
        //TODO: handle save error
      }
    };
    
    appData.clear = function(){
      appData.charts.splice(0, appData.charts.length);
      appData.save();
    };
    
    appData.lastOpen = function(){
      if(appData.charts.length > 0){
        var item = appData.charts[0];
        if(item.hasOwnProperty('editCode') && item.editCode){
          return {edit: true, code: item.editCode};
        }
        if(item.hasOwnProperty('viewCode') && item.viewCode){
          return {edit: false, code: item.viewCode};
        }
      }
    };
    
    return appData;
  });
