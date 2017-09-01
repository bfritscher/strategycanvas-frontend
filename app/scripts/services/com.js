'use strict';

/**
 * @ngdoc service
 * @name strategycanvasFrontendApp.com
 * @description
 * # com
 * Service in the strategycanvasFrontendApp.
 */
angular.module('strategycanvasFrontendApp')
  .service('com', function ($http, $routeParams, $rootScope, $location) {
    var self = this;
    var baseUri = 'http://localhost:3030';
    var socket = io(baseUri);
    var app = feathers()
    .configure(feathers.hooks())
    .configure(feathers.socketio(socket));

    this.offerings = app.service('offerings');

    function joinChannel(viewCode) {
      if(!viewCode && self.chart && self.chart.viewCode) {
        viewCode = self.chart.viewCode;
      }
      if(viewCode){
        socket.emit('join', viewCode);
      }
    }

    socket.on('connect', () => joinChannel());
    socket.on('reconnect', () => joinChannel());

    this.send = function(channel, payload){
      console.log(channel, payload);
    };


    this.offerings.on('patched', function (data) {
       console.log(data);
       if (self.chart) {
          if (data.value === null) {
            data.value = undefined;
          }
          self.chart.setOfferingByName(data.business, data.factor, data.value);
          $rootScope.$digest();
       }
    });

    this.loadChart = function(chart) {
      self.chart = null;
      var url =  baseUri + '/charts?';
      if ($routeParams.viewCode) {
        url += 'view_code=' + $routeParams.viewCode;
      }
      if ($routeParams.editCode) {
        url += 'edit_code=' + $routeParams.editCode;
      }

      return $http({method: 'GET', url: url})
      .then(function(resp) {
          if($routeParams.editCode && $routeParams.editCode !== resp.data.edit_code && resp.data.edit_code){
            $location.replace().path('/edit/' + resp.data.edit_code);
            return;
          }
          self.chart = chart;
          joinChannel(resp.data.view_code);
          return resp.data;
      }, function () {
        $rootScope.$broadcast('notfound');
      });
    };

    function handleEvent(data){
      switch(data.action){
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
          chart.removeSerieByName(data.business);
          break;
        case 'chart':
          chart.updateChartOptions(data.options);
          break;
      }
    }
  });
