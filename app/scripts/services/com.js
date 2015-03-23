'use strict';

/**
 * @ngdoc service
 * @name strategycanvasFrontendApp.com
 * @description
 * # com
 * Service in the strategycanvasFrontendApp.
 */
angular.module('strategycanvasFrontendApp')
  .service('com', function (chart) {
    
    chart.registerCom(this);
    
    this.send = function(channel, payload){
      console.log(channel, payload);
    };
    
    //$scope.grailsEvents.on('edit_' + data.viewCode, function(data){
    function handleEvent(data){
      switch(data.action){
        case 'offering':
          chart.setOfferingByName(data.business, data.factor, data.value);
          break;
        case 'factors':
          chart.updateFactors(data.factors);
          /*
          TODO get and update offerings
          if(data.offerings){
            chart.series.forEach(function(serie){
              if(data.offerings.hasOwnProperty(serie.business)){
                this.setOfferingBySerie(serie, factor, value);
              }
            });
          }
          */
          break;
        case 'serie':
          chart.updateSerie(data);
          break;
        case 'serieRemove':
          chart.removeSerieByName(data.business)
          break;
        case 'chart':
          chart.updateChartOptions(data.options);
          break;
      }
    }
  });
