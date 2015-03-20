'use strict';

/**
 * @ngdoc directive
 * @name strategycanvasFrontendApp.directive:myChart
 * @description
 * # myChart
 */
angular.module('strategycanvasFrontendApp')
  .directive('myChart', function ($window) {
    return {
      restrict: 'A',
        scope: false,
          link: function(scope, elm) {
            $(elm).mousewheel(function(event, delta) {
              elm[0].scrollLeft -= (delta * 30);
                  event.preventDefault();
              });
            var oldFactors = [],
            seriesOrder = '',
            lastClickTimeStamp = 0;
            function drawChart() {
              //console.log('drawChart');
              var chart = scope.chart;
              //root svg
              var svg = elm.find('svg');
              var supportForeignObject = typeof SVGForeignObjectElement !== 'undefined';
              
              //d3js ordinal scale only works on simple array 
              var factorNames = chart.factors.map(function(f){return f;});
              
              var delay = oldFactors.length > factorNames.length ? 500 : 0;
              // delay standard transitions if delete factor
              
              
              
              //62 = 10 20 1 svg 1 20 10
              //container_height - 42 = svg
              //margins top, right, bottom left
              var m = [ 2, chart.editCode ? 100 : 2, 100, 42 ],
                  w = Math.max(100*factorNames.length+1, 1000) - m[1] - m[3],
                  h = Math.max(430, Math.min(600, $('#mychart').height()-85)) - m[0] - m[2];
              if(svg.length === 0){
                h = 600 - m[0] - m[2]; 
              }
              

              var x = d3.scale.ordinal().domain(factorNames).rangeBands([ 0, w ]),
              y = {};

              var line = d3.svg.line(),
              axis = d3.svg.axis().orient('left');

              var currentSeriesOrder = chart.series.map(function(serie){ return serie.business;}).join('');
              var doTransition = oldFactors.length > 0 &&  seriesOrder === currentSeriesOrder && (oldFactors.length !== factorNames.length || oldFactors.join('') ===  factorNames.join(''));
              if(scope.remoteUpdate){
                scope.remoteUpdate = false;	
                doTransition = true;
              }
              
              //TODO: refactor to css?
              function updateBandingBackground(factorName){
                var i =  factorNames.indexOf(factorName);
                return ['#e5f3ff', '#fff'][i % 2 ];
              }
              function updateBandingBackgroundAdd(reverse){
                var i = factorNames.length;
                if(reverse){
                  i++;
                }
                return ['#f2f9ff', '#f9f9f9'][i % 2 ];
              }
              
              // Returns the path for a given data point.
              function path(serie) {
                var points = [];
                factorNames.forEach(function(factoreName) {
                  if(serie.offerings.hasOwnProperty(factoreName) && serie.offerings[factoreName] !== undefined){
                    //TODO handle animation of drag?
                    points.push([x(factoreName) + x.rangeBand()/2 , y[factoreName](serie.offerings[factoreName])]);	
                  }
                });
                return line(points);
              }
              
              function maybeTransiton(selection, additionalCondition){
                if(doTransition && (additionalCondition === undefined || additionalCondition)){
                  selection = selection.transition().delay(delay).duration(500);
                }
                return selection;
              }
              
              // Create a scale for each trait.
              factorNames.forEach(function(factorName) {
                y[factorName] = d3.scale.linear().domain([-0.1,1.1]).range([ h, 0 ]);
              });
              elm.dragscrollable();
              if(svg.length === 0){
                svg = d3.select(elm[0]).append('svg:svg')
                  .attr('xmlns', 'http://www.w3.org/2000/svg')
                  .append('svg:g').attr(
                      'transform',
                      'translate(' + m[3] + ',' + m[0] + ')');
              }else{
                svg = d3.select(elm[0]).select('svg').select('g');
              }
              d3.select(elm[0]).select('svg')
              .attr('width', w + m[1] + m[3])
              .attr('height', h + m[0] + m[2]);

              if(chart.editCode){
                var addFactorGroup = svg.select('g.addfactor');
                if(addFactorGroup.node() === null){
                  addFactorGroup = svg.append('svg:g')
                  .attr('class', 'addfactor no-select')
                  .on('click', function (){
                    scope.$apply(function(){
                      scope.dialog.add = true;
                    });
                  });
                  
                  addFactorGroup.append('svg:rect')
                  .attr('class', 'backgroundFactor')
                  .attr('x', 0)
                  .attr('y', 0);
                  
                  addFactorGroup.append('svg:text')
                  .attr('class', 'icon-plus')
                  .attr('style', 'font-size:90px; fill: #adc8e3')
                  .text('\uf067');
                }
                
                addFactorGroup.select('rect')
                .attr('width', 100)
                .attr('height', h)
                .style('fill', updateBandingBackgroundAdd());
                
                addFactorGroup.select('text')
                .attr('transform','translate(-35, 38)')
                .attr('x', 50)
                .attr('y', h/2);
                
                addFactorGroup
                .attr('transform', 'translate(' + (w+2) + ')');
              }
              
              //legend background
              var legendBackground = svg.select('rect.legendbackground');
              if(legendBackground.node() === null){
                legendBackground =  svg.append('svg:rect')
                .attr('class', 'legendbackground')
                .attr('x', 0)
                .attr('height', m[2]);
              }
              legendBackground
              .attr('width', w)
              .attr('y', h);
              
              //border
              var backBorder = svg.select('rect.border');
              if(backBorder.node() === null){
                backBorder = svg.append('svg:rect')
                .attr('class', 'border')
                .attr('x', -1)
                .attr('y', -1);
                
                if(chart.editCode){
                  svg.append('svg:text')
                  .attr('class', 'addfactorhelp')
                  .attr('x', 100)
                  .attr('style', 'font-size:100px;fill:#fbfbfb')
                  .text('Add a factor');
                  
                  svg.append('svg:text')
                  .attr('class', 'icon-double-angle-right addfactorhelparrow')
                  .attr('x', 680)
                  .attr('style', 'font-size:80px;fill:#fbfbfb')
                  .text('\uf061');
                }
              }
              
                svg.select('.addfactorhelp')
                .attr('y', h/2 + 30)
                .style('fill', factorNames.length > 0 ? '#fbfbfb' : '#adc8e3');
                
                svg.select('.addfactorhelparrow')
                .attr('y', h/2 + 30)
                .style('fill', factorNames.length > 0 ? '#fbfbfb' : '#adc8e3');
              
              //animate only on delete delete
              maybeTransiton(backBorder, oldFactors.length > factorNames.length)
              .attr('width', w+2)
              .attr('height', h+2);
              
              var mainAxis = svg.select('g.mainaxis');
              if(mainAxis.node() === null){
                mainAxis = svg.append('svg:g')
                .attr('class', 'mainaxis no-select')
                .attr('transform', 'translate(-40)');
                
                mainAxis.append('svg:text')
                .attr('x', 0)
                .attr('y', 14)
                .text('High');
                
                mainAxis.append('svg:text')
                .attr('class', 'l-offering')
                .text('Offerings');
                
                mainAxis.append('svg:text')
                .attr('class', 'l-factor')
                .text('Factors of Competition');
                
                mainAxis.append('svg:text')
                .attr('class', 'l-low')
                .attr('x', 0)
                .text('Low');
              }
              mainAxis.select('.l-offering')
              .attr('transform', 'rotate(-90, 14, '+ (h/2+29) +')')
              .attr('x', 14)
              .attr('y', h/2+29);
              
              mainAxis.select('.l-factor')
              .attr('x', w/2 - 30)
              .attr('y', h + m[2]);
              
              mainAxis.select('.l-low')
              .attr('y', h-2);
              
              
              //background
              var backgroundGroup = svg.select('.background');
              if(backgroundGroup.node() === null){
                backgroundGroup = svg.append('svg:g').attr('class', 'background');
              }
              
              
              
              //add background by name
              var backgroundFactor = backgroundGroup.selectAll('.backgroundFactor').data(factorNames, function(d){return d;});
              backgroundFactor.enter()
              .append('svg:rect')
              .attr('class', 'backgroundFactor')
              .attr('x', w)
              .attr('y', 0)
              .attr('width', 0)
              .attr('height', h);

              //factor banding background color update
              backgroundFactor
              .style('fill', updateBandingBackground);
              
              maybeTransiton(backgroundFactor)
              .attr('x',  function(factorName){ return x(factorName);})
              .attr('width', x.rangeBand())
              .attr('height', h);
              
              
              
              
                // Add foreground lines.
              var foreground = svg.select('g.foreground');
              if(foreground[0][0] === null){
                foreground = svg.append('svg:g').attr('class', 'foreground');
              }
              var svgPath = foreground.selectAll('.line').data(chart.series);
                
              svgPath.enter().append('svg:path')
              .attr('class', 'line')
              .attr('stroke-dasharray', function(serie){return serie.dash;})
              .style('stroke', function(serie){
                return serie.color;
              });
              //update
              maybeTransiton(svgPath).attr('d', path).attr('stroke-dasharray', function(serie){return serie.dash;})
              .style('stroke', function(serie){
                return serie.color;
              });
              
              svgPath.exit().transition().duration(500).style('opacity', 0).remove();
              
              //factors groupHolder
              var factorGroup = svg.select('.factorGroup');
              //other more d3js ways possible?
              if(factorGroup.node() === null){
                factorGroup = svg.append('svg:g').attr('class', 'factorGroup');
              }
              
              // Add a group element for each trait.
              var factorContainer = factorGroup.selectAll('.factor').data(factorNames, function(d){return d;});
              var factorContainerEnter = factorContainer.enter()
                  .append('svg:g').attr('class', 'factor no-select')
                  //appear from the right
                  .attr(
                      'transform', function() {
                        return 'translate(' + w + ')';
                      });
              
              //invisible rect to force size of group and be draggable?
              factorContainerEnter.append('svg:rect')
              .attr('class', 'factorSize')
              .attr('x', 0)
              .attr('y', 0)
              .attr('height', h);
              
              
              
              //Add an axis and title.
              var addOfferingHandler = null;
              if(chart.editCode){
                addOfferingHandler = function(factorName){
                  if (d3.event.type === 'touchstart'){
                    d3.event.stopPropagation();
                  }
                  if(d3.event.timeStamp - lastClickTimeStamp < 300){
                    return false;
                  }
                  
                  lastClickTimeStamp = d3.event.timeStamp;
                  if ($(this).data('already')) {
                        $(this).data('already', false);
                        return false;
                    } else if (event.type === 'touchstart') {
                        $(this).data('already', true);
                    }
                  
                  
                  var pos = d3.event.changedTouches ? d3.touches(this,  d3.event.changedTouches)[0] : d3.mouse(this);
                  
                  var v = Math.max(0, Math.min(1, y[factorName].invert(pos[1])));
                  for(var i=chart.series.length-1; i >= 0; i--){
                    if(chart.series[i].offerings[factorName] === undefined){
                      scope.$apply(function(){
                        scope.notifyOfferingChange(chart.series[i], factorName, v);
                        $window.ga('send', 'event', 'offering', 'add', chart.editCode);
                      });
                      return;
                    }
                  }
                  //create new serie to add point
                  //TODO: refactor: into controller/service
                  scope.$apply(function(){
                    var series = scope.addSerie();
                    $window.ga('send', 'event', 'serie', 'autoadd', chart.editCode);
                    scope.notifyOfferingChange(series[0], factorName, v);
                    $window.ga('send', 'event', 'offering', 'add', chart.editCode);
                  });
                  
                };
              }
              
              factorContainerEnter
              .append('svg:g')
              .attr('class', 'axis')
              .append('svg:rect')
              .attr('class', 'domain')
              .attr('y', function(factorName){ return y[factorName](1)-25;})
              .attr('width', 50)
              .attr('height', function(factorName){ return 50+y[factorName](0)-y[factorName](1);})
              .on('mousedown', function(){
              d3.event.stopPropagation();
            })
            .on('touchstart', addOfferingHandler)
            .on('click', addOfferingHandler);
              
              
              //hate IE... even 10
              if(!supportForeignObject){
                d3.select(elm[0])
                .selectAll('div.iexlegend')
                .data(factorNames)
                .enter()
                .append('html:div')
                .attr('class', 'iexlegend');
                
                 
                var pos = $('#mychart .legendbackground').offset();
                d3.select(elm[0]).selectAll('div.iexlegend')
                .attr('style', function(factorName){
                  return 'top:' + (pos.top - 65) + 'px;' +
                    'left:' + (x(factorName) + pos.left) + 'px;' +
                    'width:' + x.rangeBand() + 'px;';})
                  .text(String)
                  .on('mousedown', function(){
                d3.event.stopPropagation();	
              })
              .on('touchstart', function(){
                d3.event.stopPropagation();	
              })
                .on('mouseup', function(factorName){
                  if(chart.editCode){
                    scope.$apply(function(){
                      scope.showRemoveDialog('factor',factorName);
                    });
                  }
                });
              }
              
              factorContainerEnter.select('.axis').append('svg:foreignObject')
              .attr('class', 'xlegend-wrapper')
              .attr('y', h + 20)
              .attr('width', 0)
              .attr('height', 50) //TODO: custom height?
              .append('xhtml:body')
              .attr('xmlns', 'http://www.w3.org/1999/xhtml')
              .append('xhtml:div')
              .attr('class', 'xlegend')
              .text(String)
              .on('mousedown', function(){
              d3.event.stopPropagation();	
            })
            .on('touchstart', function(){
              d3.event.stopPropagation();	
            })
              .on('mouseup', function(factorName){
                if(chart.editCode){
                  scope.$apply(function(){
                    scope.showRemoveDialog('factor',factorName);
                  });
                }
              });
              
              factorContainer.select('.xlegend-wrapper')
              .attr('width', function(){return x.rangeBand();})
              .attr('y', h + 20);
              
              factorContainer.select('.factorSize')
              .attr('width', x.rangeBand())
              .attr('height', h);
              
              var domainWidth = Math.max(50, x.rangeBand()/3);
              
              factorContainer.select('.domain')
              .attr('y', function(factorName){ return y[factorName](1)-25;})
              .attr('x', (x.rangeBand()-domainWidth)/2)
              .attr('width', domainWidth)
              .attr('height', function(factorName){ return 50+y[factorName](0)-y[factorName](1);});
              
              factorContainer.exit().transition().duration(500).style('opacity', 0).remove();	
              backgroundFactor.exit().transition().duration(500).attr('width', 0).attr('x', function(){
                return parseFloat(d3.select(this).attr('x')) + x.rangeBand()/2;
              }).remove();
              
              //handle factor dragging right-left
              if(chart.editCode){
              var isDraging = false;
              factorContainer
              .call(d3.behavior.drag().origin(function(factorName) {
                  return {
                    x : x(factorName),
                    y : null
                  };
                })
                .on('dragstart', function (factorName) {
                  isDraging = false;
                  var i = factorNames.indexOf(factorName);
                  //move to top visible
                  var node = d3.select(this).node();
                  node.parentNode.appendChild(node);
                  backgroundGroup.node().appendChild(backgroundFactor[0][i]);
                })
                .on('drag', function (factorName) {
                  if(Math.abs(x(factorName) - d3.event.x) < 30 && !isDraging){
                    return;
                  }
                  isDraging = true;
                  var i = x.domain().indexOf(factorName);
                  x.range()[i] = d3.event.x;
                  factorNames.sort(function(a, b) {
                    return x(a) - x(b);
                  });
                  var dragX = x(factorName);
                  
                  foreground.selectAll('.foreground .line').attr('d', path);
                  x.domain(factorNames).rangeBands([ 0, w ]);
                  
                  if(!supportForeignObject){ //ie... 
                    var pos = $('#mychart .legendbackground').offset();
                      d3.select(elm[0]).selectAll('div.iexlegend')
                      .attr('style', function(d){
                        return 'top:' + (pos.top - 65) + 'px;' + 
                          'left:' + ((d === factorName ? dragX : x(d)) + pos.left) + 'px;' +
                          'width:' + x.rangeBand() + 'px;';})
                        .text(String);
                  }
                  
                  factorContainer.filter(':last-child').attr('transform', 'translate('+ dragX + ')');
                  factorContainer.filter(':not(:last-child)').transition().duration(200).ease('linear')
                  .attr('transform',  function(d){ return 'translate(' + x(d) + ')';});

              backgroundFactor.style('fill', updateBandingBackground);
              backgroundFactor.filter(':last-child').attr('x', dragX);
              backgroundFactor.filter(':not(:last-child)').transition().duration(200).ease('linear')
              .attr('x',  function(d){ return x(d);});
                  
                })
                .on('dragend', function () {
                  isDraging = false;
                  x.domain(factorNames).rangeBands([ 0, w ]);
                  
                  var t = d3.transition().duration(500);
                  t.selectAll('.factor').attr('transform',function(d) {
                    return 'translate(' + x(d) + ')';
                  });
                  
                  if(!supportForeignObject){
                    var pos = $('#mychart .legendbackground').offset();
                      t.selectAll('div.iexlegend')
                      .style('left', function(d){
                        return (x(d) + pos.left) + 'px';
                      });
                  }
                  
                  
                  backgroundGroup.selectAll('.backgroundFactor').attr('x',  function(factorName){ return x(factorName);});
                  t.selectAll('.foreground .line').attr('d', path);
                  t.transition().each('end', function(){
                    if(factorNames.join('') !== chart.factors.join('')){
                      scope.$apply(function(){
                        scope.notifyFactorsChange(factorNames);
                        $window.ga('send', 'event', 'factor', 'dragged', chart.editCode);
                      });
                    }
                  });
                })
              );
              }//end edit
    
              maybeTransiton(factorContainer).attr(
                  'transform', function(factorName) {
                    return 'translate(' + x(factorName) + ')';
              });
              
              
              //add offering onto domain axis
              
              var marker = factorContainer.selectAll('.dot')
                 .data( function( factorName) {
                  var points = [];
                  chart.series.forEach(function(serie) {
                    if(serie.offerings.hasOwnProperty(factorName) && serie.offerings[factorName] !== undefined){
                      points.push({factorName: factorName, serie: serie});
                    }
                  });
                return points;} );
              var markerEnter = marker.enter()
                  .append('svg:g')
                  .attr('class', 'dot')
                  .attr('transform', function(d){ return 'matrix(0, 0, 0, 0, '+(x.rangeBand()/2)+', '+y[d.factorName](d.serie.offerings[d.factorName])+')';});
              markerEnter.transition().duration(500).ease('elastic', 1.8, 0.45)
                  .attr('transform', function(d){ return 'matrix(1, 0, 0, 1, '+(x.rangeBand()/2)+', '+y[d.factorName](d.serie.offerings[d.factorName])+')';});				        		  	
              
              
              markerEnter.append('svg:path');

              markerEnter.append('svg:rect')
              .attr('x', -25)
              .attr('width', 50)
              .attr('y', -25)
              .attr('height', 50);
                
              marker.exit().remove();
              
              maybeTransiton(marker.select('path'))
              .attr('d', function(d){ return d3.svg.symbol().type(d.serie.symbol).size(function(){return scope.profile.markerSize*10;})();})
              .style('fill', function(d){ return d.serie.color;});
              
              if(chart.editCode){
              
              marker.select('rect')
              .attr('x', -domainWidth/2)
              .attr('width', domainWidth);
                                    
              marker
                .call(
                  d3.behavior.drag().origin(function(point) {
                    return {
                      y : y[point.factorName](point.serie.offerings[point.factorName])
                    };
                  })
                  .on('dragstart', function(point){
                    //make dragged serie top one
                    var index = foreground.selectAll('.line').data().indexOf(point.serie) + 1;
                    foreground.node().appendChild(foreground.select('.line:nth-child(' + index + ')').node());
                    d3.selectAll('.dot').each(function(p){
                      if(p.serie === point.serie){
                        this.parentNode.appendChild(this);
                      }
                    });
                    
                    d3.event.sourceEvent.stopPropagation(); //we do not want to start drag on factor
                            
                  })
                  .on('drag', function(point){
                    var v = y[point.factorName].invert(d3.event.y); 
                    if( v < -0.05 && v >= -0.10){
                      point.serie.offerings[point.factorName] = v;
                      d3.select(this)
                      .attr('transform', function(d){ return 'translate('+(x.rangeBand()/2)+','+y[d.factorName](d.serie.offerings[d.factorName])+')';})
                      .select('path')
                      .attr('d', function(d){ return d3.svg.symbol()
                                                     .type(d.serie.symbol)
                                                     .size(function(){return scope.profile.markerSize*10 * (0.15 + v) / 0.1 ;})();
                                            }
                      );
                    }else if(v < -0.10){
                      point.serie.offerings[point.factorName] = undefined;
                      d3.select(this).remove();
                      scope.$apply(function(){
                        scope.notifyOfferingChange(point.serie, point.factorName, point.serie.offerings[point.factorName]);
                        $window.ga('send', 'event', 'offering', 'remove', chart.editCode);
                      });
                    }else{
                      point.serie.offerings[point.factorName] = Math.max(0, Math.min(1, v));
                      d3.select(this)
                      .attr('transform', function(d){ return 'translate('+(x.rangeBand()/2)+','+y[d.factorName](d.serie.offerings[d.factorName])+')';});
                      foreground.selectAll('.line').attr('d', path);
                    }
                  })
                  .on('dragend', function(point){
                      //normalize value if set
                      if( point.serie.offerings[point.factorName] !== undefined ){
                        point.serie.offerings[point.factorName] = Math.max(0, Math.min(1, point.serie.offerings[point.factorName]));
                        scope.$apply(function(){
                          scope.notifyOfferingChange(point.serie, point.factorName, point.serie.offerings[point.factorName]);
                          $window.ga('send', 'event', 'offering', 'edit', chart.editCode);
                        });
                      }
                  })
                );
              }
              maybeTransiton(marker).attr('transform', function(d){ return 'matrix(1, 0, 0, 1, '+(x.rangeBand()/2)+', '+y[d.factorName](d.serie.offerings[d.factorName])+')';});

              
              //save length to determine if we want transitions or not next time
              oldFactors = factorNames.slice(0);
              seriesOrder = chart.series.map(function(serie){ return serie.business;}).join('');
              
            }
scope.$watch('chart', drawChart, true);//watch
scope.$watch('profile', drawChart, true);//watch
          }
    };
  });
