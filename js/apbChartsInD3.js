/* Helper functions */

// Convenient Interitance
// http://phrogz.net/JS/classes/OOPinJS2.html
Function.prototype.inheritsFrom = function(parentClassOrObject) {
  if (parentClassOrObject.constructor == Function) {
    //Normal Inheritance
    this.prototype = new parentClassOrObject;
    this.prototype.constructor = this;
    this.prototype.parent = parentClassOrObject.prototype;
  } else {
    //Pure Virtual Inheritance
    this.prototype = parentClassOrObject;
    this.prototype.constructor = this;
    this.prototype.parent = parentClassOrObject;
  }
  return this;
}


/* BaseChart
 *
 * Base charting class providing common functions and processing for other charts
 *
*/

// Define BaseChart class
function BaseChart() {
  this.axis = d3.svg.axis();
  this.line = d3.svg.line();
}

// Stores and provides default config options
BaseChart.prototype.setToDefaultParams = function() {
  var defaultParams = {
    // Margins, padding and spacing
    margin:               {top: 10, right: 10, bottom: 10, left: 10},
    padding:              {left: 100, right: 50, top: 50, bottom: 110},
    ordinalPadding:       0.5,
    legendItemSpacing:    18,
    dy:                   {middle: 0.35, top: 0.71, xOffset: 0.20, yOffset: 1.00},
    // Color and opacity
    colorRange:           ['#37B34A', '#008CCF', '#671E75', '#CB333B', '#ED8B00'],
    baseColor:            '#EBEBEB',
    opacity:              {start: 0.05, end: 0.5},
    // Shape size
    radius:               {normal: 5, large: 10},
    // Transition
    transition:           {duration: 1250, durationShort: 1000, delay: 75},
    // Axis
    ticks:                {widthCutoff: 500, upper: 5, lower: 3},
    tickSize:             0
  };

  for(var prop in defaultParams) {
    this.config[prop] = defaultParams[prop];
  }

  // Set color range
  this.setColorRange();

  // Set delay range
  this.setDelayRange();

  // Set width and height params
  this.setDerivedParams();
}

// Computes and sets width/height params from chart width/height
BaseChart.prototype.setDerivedParams = function() {
  // Set outer sizes and compute inner sizes
  this.config.outerWidth = parseInt(this.config.chart.style('width'));
  this.config.outerHeight = parseInt(this.config.chart.style('height'));
  this.config.width = this.config.outerWidth - this.config.margin.left - this.config.margin.right - this.config.padding.left - this.config.padding.right;
  this.config.height = this.config.outerHeight - this.config.margin.top - this.config.margin.bottom - this.config.padding.top - this.config.padding.bottom;

  // Set diagonal length
  this.config.diagonal = this.calculateLength([this.config.width, this.config.height]);

  // Set radius scale domain and range
  // Domain set to 50% of chart diagonal (diagonal representing the maximum distance between two points on the chart)
  this.config.radiusScale
      .domain([0, this.config.diagonal / 2])
      .range([this.config.radius.large, this.config.radius.normal + 1]);

  // Set legend offsets
  this.config.legendOffset.x = this.config.radius.large;
  this.config.legendOffset.y = this.config.radius.large * 3;

  // Set x-axis tick count
  this.axis.ticks(this.tickCount())
           .tickSize(this.config.tickSize, this.config.tickSize);
}

BaseChart.prototype.calculateLength = function(b, a) {
  if(a == null) { a = [0, 0]; }
  return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
};

// Set color range
BaseChart.prototype.setColorRange = function() {
  this.config.colorScale.range(this.config.colorRange);
}

// Set delay range
BaseChart.prototype.setDelayRange = function() {
  this.config.delayScale.range([0, this.config.transition.delay]);
}

BaseChart.prototype.getPaddingTransform = function() {
  return 'translate(' + this.config.padding.left + ', ' + this.config.padding.top +')';
}

// Public setters for chart parameters and config
BaseChart.prototype.setConfig = function() {
  var chartParent = this.args.chartParent;
  var chartData = this.args.chartData;
  var chart = d3.select(chartParent);

  // Margins, padding and spacing
  var outerWidth;
  var outerHeight;
  var margin;
  var padding;
  var width;
  var height;
  var diagonal;
  var ordinalPadding;
  var legendItemSpacing;
  var legendOffset = {};
  var dy = {};

  // Color and opacity
  var colorRange;
  var baseColor;
  var opacity;
  var colorScale = d3.scale.ordinal();
  var delayScale = d3.scale.linear();
  var radiusScale = d3.scale.sqrt().clamp(true);

  // Element sizes
  var radius;

  // Transitions
  var transition;

  // Axes
  var ticks;
  var tickSize;

  // Create config object
  this.config = {
    chartData: chartData,
    chartParent: chartParent,
    chart: chart,
    outerWidth: outerWidth,
    outerHeight: outerHeight,
    margin: margin,
    padding: padding,
    width: width,
    height: height,
    ordinalPadding: ordinalPadding,
    legendItemSpacing: legendItemSpacing,
    legendOffset: legendOffset,
    dy: dy,
    colorRange: colorRange,
    colorScale: colorScale,
    delayScale: delayScale,
    radiusScale: radiusScale,
    baseColor: baseColor,
    opacity: opacity,
    radius: radius,
    transition: transition,
    ticks: ticks,
    tickSize: tickSize
  };

  // Set to default params
  this.setToDefaultParams();
}

// Creates SVG chart-container
BaseChart.prototype.addChartContainer = function() {
  this.destroyChart(); // Destroy existing chart first

  this.svg = this.config.chart.append('svg')
                .attr('class', 'chart-container')
                .attr('width', this.config.outerWidth)
                .attr('height', this.config.outerHeight)
              .append('g')
                .attr('transform', 'translate(' + this.config.margin.left + ',' + this.config.margin.top + ')');
}

// Adds chart title
BaseChart.prototype.addChartTitle = function() {
  // Extract chart title
  this.chartTitle = this.config.chartData.chart.title.text;

  // Remove existing title if any
  this.removeSelection('.chartTitle');

  // Add title text
  this.svg.append('g')
        .attr('class', 'chartTitle')
        .append('text')
        .text(this.chartTitle)
        .attr('dy', this.config.dy.top + 'em');

  // Set title location
  this.updateTitleLocation();
}

// Updates chartTitle location
BaseChart.prototype.updateTitleLocation = function() {
  this.svg.select('.chartTitle')
      .attr('transform', 'translate(' + (this.config.padding.left + this.config.width + this.config.padding.right) / 2 + ', ' + 0 + ')');
}

// Adds chart legend
BaseChart.prototype.addChartLegend = function() {
  var self = this;

  // Remove existing legend if any
  this.removeSelection('.legend');

  // Add legeng 'g' element and set location
  this.svg.append('g').attr('class', 'legend');
  this.updateLegendLocation();

  // Bind to seriesData
  this.legend = this.svg.select('.legend')
                  .selectAll('.legendItems')
                    .data(d3.keys(self.seriesData))
                  .enter().append('g')
                    .attr('class', 'legendItems');

  // Create and animate legend circles
  this.legend.append('circle')
              .attr('class','legendCircle')
              .attr('r', self.config.radius.normal)
              .attr('cx', self.config.radius.large)
              .attr('cy', function(d, i) { return self.config.legendItemSpacing * i; })
              .style('fill', function(d) { return self.config.colorScale(d); })
              //animated items
              .style({'stroke': self.config.baseColor,
                      'fill-opacity': self.config.opacity.start,
                      'pointer-events': 'none'})
                .transition()
                    .delay(function(d) { return self.config.delayScale(d); })
                    .duration(self.config.transition.duration)
                  .style({'stroke': function(d) { return self.config.colorScale(d); },
                          'fill-opacity': self.config.opacity.end})
                  .each('end', function() { d3.select(this).style('pointer-events', null); });

  // Create and animate legend labels
  this.legend.append('text')
              .attr('class','legendLabel')
              .text(function(d) { return self.seriesData[d].name;})
              .attr('y', function(d, i) { return self.config.legendItemSpacing * i; })
              .attr('x', -0.5 * self.config.radius.large)
              .attr('dy', self.config.dy.middle + 'em')
              .style('pointer-events', 'none')
                .transition()
                    .delay(function(d) { return self.config.delayScale(d); })
                    .duration(self.config.transition.duration)
                  .each('end', function() { d3.select(this).style('pointer-events', null); });
}

// Updates legend location
BaseChart.prototype.updateLegendLocation = function() {
  this.svg.select('.legend')
          .attr('transform', 'translate(' + (this.config.padding.left + this.config.width - this.config.legendOffset.x) + ', ' + (this.config.padding.top + this.config.height + this.config.legendOffset.y) + ')');
}

// Adds 'g' container for data labels
BaseChart.prototype.addDataLabelContainer = function() {
  this.svg.append('g')
          .attr('class', 'g-dataLabel')
          .attr('transform', this.getPaddingTransform());
}

// Adds data labels
BaseChart.prototype.addDataLabel = function(d) {
  var self = this;

  // Add x-axis labels
  self.axes.x.filter(function(p) { return p === d.xAxisName; })
            .each(function(p) {
                var label = self.svg.select('.g-dataLabel')
                              .append('text')
                              .attr('class', 'dataLabel')
                              .text(d.xValue.toFixed(2))
                              .attr('x', self.scales.x[p](d.xValue))
                              .attr('y', self.xAxisSpacing(p))
                              .style('text-anchor', 'middle')
                              .classed('activeText', true);

                if(d3.keys(self.dimensions.x).length > 1) {
                  label
                      .attr('dy', -1.5 * self.config.radius.large + 'px');
                } else {
                  label
                      .attr('dy', -1.0 * self.config.dy.xOffset + 'em')
                      .attr('dx', self.config.dy.xOffset + 'em');
                }
          });

  // Add y-axis labels if y-axes exist
  if(self.axes.y != null) {
    self.axes.y.filter(function(p) { return p === d.yAxisName; })
            .each(function(p) {
                self.svg.select('.g-dataLabel')
                  .append('text')
                  .attr('class', 'dataLabel')
                  .text(d.yValue.toFixed(2))
                  .attr('x', self.yAxisSpacing(p))
                  .attr('y', self.scales.y[p](d.yValue))
                  .attr('dy', self.config.dy.middle + 'em')
                  .attr('dx', self.config.dy.xOffset + 'em')
                  .style('text-anchor', 'start')
                  .classed('activeText', true);
            });
  }
}

// Returns number of axis ticks based on chart width
BaseChart.prototype.tickCount = function() {
  return (this.config.width > this.config.ticks.widthCutoff) ? this.config.ticks.upper : this.config.ticks.lower;
}

// Adds reset button to chart
BaseChart.prototype.addResetBtn = function() {
  // Remove existing button if exists
  this.removeSelection('.reset-btn');

  // Add reset button and hide
  this.resetBtn = this.config.chart.append('button')
                    .attr('type', 'button')
                    .attr('value', 'Reset')
                    .attr('class', 'reset-btn btn btn-default btn-sm')
                    .html('Reset');

  this.setElemDisplay('.reset-btn', false);
}

// Set button display styles
BaseChart.prototype.setElemDisplay = function(elem, v) {
  if(v) {
    this.config.chart.selectAll(elem).style('display', null);
  } else {
    this.config.chart.selectAll(elem).style('display', 'none');
  }
}

// Delete specified selection
BaseChart.prototype.removeSelection = function(elem) {
  this.config.chart.selectAll(elem).remove();
}

// Destroy all chart elements
BaseChart.prototype.destroyChart = function() {
  this.removeSelection('*');

  // Also remove resize listener for the chart from 'window'
  d3.select(window).on('resize' + '.' + this.config.chartParent, null);
}

// Set x-axis range
BaseChart.prototype.setXAxisRange = function() {
  var self = this;
  d3.keys(self.dimensions.x).map(function(p) { self.scales.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width]); });
}

// Set y-axis range
BaseChart.prototype.setYAxisRange = function() {
  var self = this;
  d3.keys(self.dimensions.y).map(function(p) { self.scales.y[p].range([self.config.height, 0]); });
}

// Set x-spacing-in y-range
BaseChart.prototype.setXAxisSpacingRange = function() {
  var self = this;

  // If provided multiple x-axes, space x-axes vertically across chart height
  if(d3.keys(self.dimensions.x).length > 1) {
    this.xAxisSpacing.rangePoints([0, self.config.height], self.config.ordinalPadding)
  } else {   // Otherwise solve for appropriate y-intercept
    var yAxis = d3.keys(self.dimensions.y)[0];
    var yDomain = self.scales.y[yAxis].domain();
    this.intercept.y = Math.min(Math.max(0, yDomain[0]), yDomain[1]);
    this.xAxisSpacing.range([self.scales.y[yAxis](this.intercept.y), self.scales.y[yAxis](this.intercept.y)]);
  }
}

// Set y-spacing-in x-range
BaseChart.prototype.setYAxisSpacingRange = function() {
  var self = this;

  if(this.yAxisSpacing != null) {
    var xAxis = d3.keys(self.dimensions.x)[0];
    var xDomain = self.scales.x[xAxis].domain();
    this.intercept.x = Math.min(Math.max(0, xDomain[0]), xDomain[1]); // Solve for appropriate x-intercept
    this.yAxisSpacing.range([self.scales.x[xAxis](this.intercept.x), self.scales.x[xAxis](this.intercept.x)]);
  }
}

// Process chart data
BaseChart.prototype.processChartData = function() {
  this.dimensions = {};
  this.seriesData = {};
  this.scales = {};
  this.intercept = {};

  var self = this;

  // Extract xAxis.axes
  if(self.config.chartData.xAxis != null) {
      self.dimensions.x = {};
      self.scales.x = {};
      self.config.chartData.xAxis.axes.forEach(function(d, i) {
        self.dimensions.x[d.name] = {};
        self.dimensions.x[d.name].type = 'x';
        self.dimensions.x[d.name].parameters = d.parameters;
        self.dimensions.x[d.name].dataObjects = [];
        self.dimensions.x[d.name].calcs = {};
        self.dimensions.x[d.name].calcs.floorXpx = 0; // floorXpx is used by RulerChart
        self.scales.x[d.name] = d3.scale.linear();
      })
      self.setXAxisRange();

      // Scale to space x-axes vertically
      self.xAxisSpacing = d3.scale.ordinal().domain(d3.keys(self.dimensions.x));
  }

  // If provided multiple x-axes, ignore yAxis
  if(!(d3.keys(self.dimensions.x).length > 1)) {
    // Otherwise, extract yAxis.axes
    if(self.config.chartData.yAxis != null) {
        self.dimensions.y = {};
        self.scales.y = {};
        self.config.chartData.yAxis.axes.forEach(function(d, i) {
          self.dimensions.y[d.name] = {};
          self.dimensions.y[d.name].type = 'y';
          self.dimensions.y[d.name].parameters = d.parameters;
          self.dimensions.y[d.name].dataObjects = [];
          self.dimensions.y[d.name].calcs = {};
          self.scales.y[d.name] = d3.scale.linear();
        })
        self.setYAxisRange();
    }

    // Scale to space y-axis horizontally
    self.yAxisSpacing = d3.scale.ordinal().domain(d3.keys(self.dimensions.y));
  }

  // Extract series.data
  self.config.chartData.series.data.forEach(function(d, i) {
    self.seriesData[i] = {};    // 'i' serves as unique index for seriesData
    self.seriesData[i].name = d.name;
    self.seriesData[i].dataObjects = [];

    // Processs series.data.data
    d.data.forEach(function(dd, ii) {
      // Check if xAxisName property is defined (e.g. RulerChart)
      if(dd.xAxisName != null) {
        // Cross-reference against xAxis.axes
        if(self.dimensions.x[dd.xAxisName] != null) {
          // seriesData dataObjects properties are named to differentiate between axis types
          // e.g. xAxisName/xValue and yAxisName/yValue
          var obj = {
            seriesIndex:     i,
            seriesName:      d.name,
            xAxisName:       dd.xAxisName,
            xValue:          dd.x
          };
          self.seriesData[i].dataObjects.push(obj);

          // dimensions dataObjects use generic axisName/value properties since axis type is known
          // this allows for consistent processing - extent, domain etc. - across axes
          var obj = {
            seriesIndex:     i,
            seriesName:      d.name,
            axisName:        dd.xAxisName,
            value:           dd.x
          };
          self.dimensions.x[dd.xAxisName].dataObjects.push(obj);
        }
      // Check if x and y values are defined (e.g. XYPlot, ScatterPlot)
      } else if((dd.x != null) && (dd.y != null)) {
        // Check that only one x- and y-axis is defined
        if((d3.keys(self.dimensions.x).length === 1) && (d3.keys(self.dimensions.y).length === 1)) {
          var xAxisName = d3.keys(self.dimensions.x)[0];
          var yAxisName = d3.keys(self.dimensions.y)[0];

          var obj = {
            seriesIndex:      i,
            seriesName:       d.name,
            xValue:           dd.x,
            xAxisName:        xAxisName,
            yValue:           dd.y,
            yAxisName:        yAxisName
          };
          self.seriesData[i].dataObjects.push(obj);

          var obj = {
            seriesIndex:     i,
            seriesName:      d.name,
            axisName:        xAxisName,
            value:           dd.x
          };
          self.dimensions.x[xAxisName].dataObjects.push(obj);

          var obj = {
            seriesIndex:     i,
            seriesName:      d.name,
            axisName:        yAxisName,
            value:           dd.y
          };
          self.dimensions.y[yAxisName].dataObjects.push(obj);
        }
      }
    });
  });

  // Map colors to series.data index
  this.config.colorScale.domain(d3.keys(self.seriesData));
  this.config.delayScale.domain(d3.keys(self.seriesData));

  // Calculate axes domains
  for(var axisType in self.dimensions) {
    for(var axis in self.dimensions[axisType]) {
      // Compute extent from data
      self.dimensions[axisType][axis].calcs.origExtent = d3.extent(self.dimensions[axisType][axis].dataObjects.map(function(d){ return d.value; }));
      // Incorporate min parameter
      self.dimensions[axisType][axis].calcs.origExtent[0] = d3.min([self.dimensions[axisType][axis].calcs.origExtent[0], self.dimensions[axisType][axis].parameters.min]);
      // Incorporate max parameter
      self.dimensions[axisType][axis].calcs.origExtent[1] = d3.max([self.dimensions[axisType][axis].calcs.origExtent[1], self.dimensions[axisType][axis].parameters.max]);

      // Set scale domain
      self.scales[axisType][axis].domain(self.dimensions[axisType][axis].calcs.origExtent);
    }
  };

  // Set ranges for xAxisSpacing and yAxisSpacing
  self.setXAxisSpacingRange();
  self.setYAxisSpacingRange();
}

// Adds x and y axes and axis labels
BaseChart.prototype.addChartAxes = function() {
  var self = this;
  self.axes = {};

  // Process x axes
  if(d3.keys(self.dimensions.x).length > 0) {
      // Add a group element for each x-axis
      self.axes.x = self.svg.selectAll('.x-axis')
                      .data(d3.keys(self.dimensions.x))
                    .enter().append('g')
                      .attr('class', 'dimension');
      self.updateXAxesLocation();

      // Add x-axes
      self.axes.x.append('g').attr('class', 'axis');
      self.generateAxes(self.axes.x, 'x');

      // Add axis labels
      self.axes.x.append('text')
          .attr('class', 'axisLabel x')
          .text(function(p) { return self.dimensions.x[p].parameters.displayName; });
      self.positionXAxisLabel();
    }

  // Process y axes
  if(d3.keys(self.dimensions.y).length > 0) {
    // Add a group element for y-axis
    self.axes.y = self.svg.selectAll('.y-axis')
                    .data(d3.keys(self.dimensions.y))
                  .enter().append('g')
                    .attr('class', 'dimension');
    self.updateYAxesLocation();

    // Add y-axis
    self.axes.y.append('g').attr('class', 'axis');
    self.generateAxes(self.axes.y, 'y');

    // Add y-axis labels
    self.axes.y.append('text')
        .attr('class', 'axisLabel y')
        .attr('transform', 'rotate(-90)')
        .attr('dy', self.config.dy.yOffset + 'em')
        .text(function(p) { return self.dimensions.y[p].parameters.displayName; });
  }
}

// Updates x-axis location
BaseChart.prototype.updateXAxesLocation = function(duration) {
  var self = this;
  this.axes.x.transition()
      .duration(function() { return duration ? duration : 0; })
    .attr('transform', function(p) {
        return 'translate(' + self.config.padding.left + ', ' + (self.config.padding.top + self.xAxisSpacing(p)) + ')';
      });
}

// Updates y-axis location
BaseChart.prototype.updateYAxesLocation = function(duration) {
  var self = this;
  if(this.axes.y != null) {
    this.axes.y.transition()
        .duration(function() { return duration ? duration : 0; })
      .attr('transform', function(p) {
          return 'translate(' + (self.config.padding.left + self.yAxisSpacing(p)) + ', ' + self.config.padding.top + ')';
        });
  }
}

// Generates axes on selection
BaseChart.prototype.generateAxes = function(sel, type, duration) {
  if(sel != null) {
    var self = this;
    var orient = (type === 'y') ? 'left' : 'bottom';
    duration = (duration != null) ? duration : self.config.transition.duration;

    sel.selectAll('.axis').each(function(p) {
                                  d3.select(this)
                                    .transition()
                                      .duration(duration)
                                    .call(self.axis.orient(orient).scale(self.scales[type][p]));
                                });
  }
}

BaseChart.prototype.addChartGridLines = function() {
  var self = this;

  // Remove existing gridlines if any
  this.removeSelection('.gridlines');

  // Add a 'g' element to house gridlines (insert before dimensions/axes)
  var gridLines = this.svg.insert('g', '.dimension')
                      .attr('class', 'gridlines')
                      .attr('transform', this.getPaddingTransform());

  // Get axes ticks; filter out intercepts and domain ends
  var ticks = {};
  d3.keys(self.dimensions).map(function(a) {
      ticks[a] = {};
    d3.keys(self.dimensions[a]).map(function(p) {
      ticks[a].name = p;
      ticks[a].data = self.scales[a][p].ticks(self.tickCount())
                              .filter(function(d) {
                                return (d.toFixed(5) !== self.intercept[a].toFixed(5))
                                    && (d.toFixed(5) !== self.scales[a][p].domain()[0].toFixed(5))
                                    && (d.toFixed(5) !== self.scales[a][p].domain()[1].toFixed(5));
                              });
    })
  });

  // Add grid lines
  gridLines.selectAll('.gridline-x')
                .data(ticks.x.data)
             .enter().append('line')
                .attr({
                        'class': 'gridline-x',
                        'x1': function(d) { return self.scales.x[ticks.x.name](d); },
                        'x2': function(d) { return self.scales.x[ticks.x.name](d); },
                        'y1': 0,
                        'y2': self.config.height
                });

  gridLines.selectAll('.gridline-y')
                .data(ticks.y.data)
             .enter().append('line')
                .attr({
                        'class': 'gridline-y',
                        'x1': 0,
                        'x2': self.config.width,
                        'y1': function(d) { return self.scales.y[ticks.y.name](d); },
                        'y2': function(d) { return self.scales.y[ticks.y.name](d); }
                });

  // Animate
  gridLines.selectAll('line')
    .style('stroke-opacity', 0)
     .transition()
         .delay(self.config.transition.durationShort)
         .duration(self.config.transition.durationShort)
        .style('stroke-opacity', self.config.opacity.end);
}

// Position x-axis labels
BaseChart.prototype.positionXAxisLabel = function() {
  if(d3.keys(this.dimensions.x).length > 1) {
    this.axes.x.select('.axisLabel.x')
              .attr('x', -1 * this.config.radius.large);
  } else {
    this.axes.x.select('.axisLabel.x')
              .attr('x', this.config.width)
              .attr('dy', -1 * this.config.dy.xOffset + 'em');
  }
}

BaseChart.prototype.yValueRange = function(d) {
  return (d.yAxisName != null) ? this.scales.y[d.yAxisName](d.yValue) : this.xAxisSpacing(d.xAxisName);
}

// Adds data points to charts
BaseChart.prototype.addChartDataPoints = function() {
  var self = this;
  var config = this.config;

  // Add g element for each data series
  this.series = this.svg.selectAll('.g-series')
                          .data(d3.keys(self.seriesData))
                        .enter().insert('g', '.g-dataLabel')
                          .attr('class', 'g-series')
                          .attr('transform', this.getPaddingTransform());

  this.series.each(function(p) {
      // Add circles for all series.dataObjects
      d3.select(this).selectAll('.g-circle')
        .data(self.seriesData[p].dataObjects)
      .enter().append('g')
        .attr('class', 'g-circle')
          .append('circle')
          .attr('class', 'circle')
          .attr('r', config.radius.normal)
          .style('fill', function(d) {
              d.circle = this;  // http://bl.ocks.org/mbostock/8033015
              return config.colorScale(d.seriesIndex);
            });

      // Animate position
      d3.select(this).selectAll('.g-circle')
        .attr('transform', function(d) {
            // Position circles at intercepts
            var x = (d.yAxisName != null) ? self.yAxisSpacing(d.yAxisName) : 0;
            return 'translate(' + x + ', ' + self.xAxisSpacing(d.xAxisName) + ')';
          })
        .transition()
            .delay(function(d) { return config.delayScale(d.seriesIndex); })
            .duration(config.transition.duration)
          .attr('transform', function(d) {
              // Transition circles to xValue/yValue
              return 'translate(' + self.scales.x[d.xAxisName](d.xValue) + ',' + self.yValueRange(d) + ')';
          });

      // Animate look
      d3.select(this).selectAll('.circle')
        .style({'stroke': config.baseColor,
                'fill-opacity': config.opacity.start,
                'pointer-events': 'none'})
        .transition()
            .delay(function(d) { return config.delayScale(d.seriesIndex); })
            .duration(config.transition.duration)
          .style({'stroke': function(d) { return config.colorScale(d.seriesIndex); },
                  'fill-opacity': config.opacity.end})
          .each('end', function() { d3.select(this).style('pointer-events', null); });
  });
}

// Set legend highlight
BaseChart.prototype.setLegendHighlight = function(elem, bool) {
  var self = this;
  elem.select('.legendCircle').attr('r', function() { return (bool) ? self.config.radius.large: self.config.radius.normal; });
  elem.select('.legendLabel').classed('activeText', bool);
}

// Generic circle mouseover events
BaseChart.prototype.circleMouseover = function(elem, d) {
  var self = this;

  // Increase circle radius
  elem.select('.circle').attr('r', this.config.radius.large);

  // Add data label
  this.addDataLabel(d);

  // Highlight legend corresponding to selected circle
  this.legend.filter(function(p) { return +p === +d.seriesIndex; })
      .each(function(p) { self.setLegendHighlight(d3.select(this), true); });

  // Draw data line to axes
  this.drawLineToAxes(d);
}

// Generic circle mouseout events
BaseChart.prototype.circleMouseout = function(elem, d) {
  var self = this;

  // Return circle radius to normal
  elem.select('.circle').attr('r', this.config.radius.normal);

  // Remove data labels
  this.removeSelection('.dataLabel');

  // Un-highlight legend
  this.legend.filter(function(p) { return +p === +d.seriesIndex; })
      .each(function(p) { self.setLegendHighlight(d3.select(this), false); });

  // Remove data line
  this.removeSelection('.dataLine');
}

// Generic legend mouseover events
BaseChart.prototype.legendMouseover = function(elem, p) {
  var self = this;

  // Highlight legend
  this.setLegendHighlight(elem, true);

  // Highlight circles corresponding to selected legend item
  this.series.selectAll('.g-circle')
              .filter(function(d) { return +d.seriesIndex === +p; })
              .each(function(d) {
                d3.select(this).select('.circle').attr('r', self.config.radius.large);
                self.addDataLabel(d);
              });
}

// Generic legend mouseout events
BaseChart.prototype.legendMouseout = function(elem, p) {
  var self = this;

  // Un-highlight legend
  this.setLegendHighlight(elem, false);

  // Un-highlight circles
  this.series.selectAll('.g-circle')
              .filter(function(d) { return +d.seriesIndex === +p; })
              .each(function(d) {
                d3.select(this).select('.circle').attr('r', self.config.radius.normal);
              });

  // Remove data labels
  self.removeSelection('.dataLabel');
}

// Highlight axisLabels matching d's axes
BaseChart.prototype.highlightAxis = function(d, bool) {
  this.axes.x.filter(function(p) { return p === d.xAxisName; })
      .select('.axisLabel').classed('activeText', bool);

  if(this.axes.y != null) {
    this.axes.y.filter(function(p) { return p === d.yAxisName; })
        .select('.axisLabel').classed('activeText', bool);
  };
}

// Adds 'g' container for data lines
BaseChart.prototype.addDataLineContainer = function() {
  this.svg.append('g')
          .attr('class', 'g-dataLine')
          .attr('transform', this.getPaddingTransform());
}

// Returns the path for a given data point to axes
BaseChart.prototype.pathToAxes = function(d) {
  // var self = this;
  var coords = [];

  coords.push([this.yAxisSpacing(d.yAxisName), this.scales.y[d.yAxisName](d.yValue)]);
  coords.push([this.scales.x[d.xAxisName](d.xValue), this.scales.y[d.yAxisName](d.yValue)]);
  coords.push([this.scales.x[d.xAxisName](d.xValue), this.xAxisSpacing(d.xAxisName)]);

  return this.line(coords);
}

// Draws line from data point to axes
BaseChart.prototype.drawLineToAxes = function(d) {
  this.svg.select('.g-dataLine')
    .append('path')
    .attr('class', 'dataLine')
    .attr('d', this.pathToAxes(d))
    .style('stroke', this.config.colorScale(d.seriesIndex));
}

// Center main data line
BaseChart.prototype.centerMainLineToAxes = function(d) {
  this.svg.select('.mainDataLine')
    .transition()
        .duration(this.config.transition.durationShort)
      .attr('d', this.pathToAxes(d));
}

// Returns rolled up data for voronoi maps
BaseChart.prototype.voronoiRollup = function(data) {
  var self = this;

  var rollup = d3.nest()
                .key(function(d) {
                  return self.scales.x[d.xAxisName](d.xValue).toFixed(5) + ',' + self.yValueRange(d).toFixed(5);
                })
                .rollup(function(v) { return v[0]; })
                .entries(data)
                .map(function(d) { return d.values; });

  return rollup;
}

// Adds voronoi paths
BaseChart.prototype.addVoronoiPaths = function() {
  this.allDataPoints = [];
  var config = this.config;
  var self = this;

  // Push all data points into an array
  for(var prop in d3.keys(self.seriesData)) {
    self.seriesData[prop].dataObjects.map(function(d) { self.allDataPoints.push(d); });
  }

  // Create a voronoi layout
  this.voronoi = d3.geom.voronoi()
                  .clipExtent([[0, 0], [config.width, config.height]])
                  .x(function(d) { return self.scales.x[d.xAxisName](d.xValue); })
                  .y(function(d) { return self.yValueRange(d); });

  // Remove existing voronoi (if any)
  this.removeSelection('.g-voronoi');

  // Create a 'g' container for voronoi polygons (insert before g-series)
  var voronoiPaths = this.svg.insert('g', '.g-series')
                          .attr('class', 'g-voronoi')
                          .attr('transform', this.getPaddingTransform());

  // Add voronoi polygon paths to chart
  voronoiPaths.selectAll('.voronoi-path')
                .data(this.voronoi(this.voronoiRollup(this.allDataPoints)))
              .enter().append('path')
                .attr('class', 'voronoi-path')
                .attr('d', function(d) { return 'M' + d.join('L') + 'Z'; })
                .datum(function(d) { return d.point; });

  var circleCoord;
  // Add simple mouse listeners that highlight related data point circles
  voronoiPaths.selectAll('.voronoi-path')
    .on('mouseover', function(d) {
      // Store related circle's position (for use by mousemove)
      circleCoord = d3.transform(d3.select(d.circle.parentNode).attr('transform')).translate;
    })
    .on('mousemove', function(d) {
      // self.svg.selectAll('.voronoi-path').classed('voronoi-path-enabled', true);
      // d3.select(this).classed('voronoi-path-select', true);

      var mouseCoord = d3.mouse(this);
      var distToCircle = self.calculateLength(mouseCoord, circleCoord);
      d3.select(d.circle).attr('r', config.radiusScale(distToCircle));
    })
    .on('mouseout', function(d) {
      // self.svg.selectAll('.voronoi-path').classed('voronoi-path-enabled', false);
      // d3.select(this).classed('voronoi-path-select', false);

      circleCoord = null;
      d3.select(d.circle).attr('r', config.radius.normal);
    });
}

// Transitions/updates voronoi paths
BaseChart.prototype.updateVoronoiPaths = function() {
  this.svg.selectAll('.voronoi-path')
          .data(this.voronoi(this.voronoiRollup(this.allDataPoints)))
          .attr('d', function(d) { return 'M' + d.join('L') + 'Z'; })
          .datum(function(d) { return d.point; });
}

// Parent draw function to generate basic chart layout
BaseChart.prototype.draw = function() {
  var self = this;

  // Create SVG to house chart
  this.addChartContainer();

  // Add chart title
  this.addChartTitle();

  // Process chart data and create x/y scales
  this.processChartData();

  // Add legend
  this.addChartLegend();

  // Add chart axes
  this.addChartAxes();

  // Add a container for data lines
  this.addDataLineContainer();

  // Add a container for data labels
  this.addDataLabelContainer();

  // Add a reset button
  this.addResetBtn();

  // Resize chart on window resize
  // https://github.com/mbostock/d3/wiki/Selections#on
  // To register multiple listeners for the same event type, the type may be followed by an optional namespace...
  d3.select(window).on('resize' + '.' + self.config.chartParent, function() { self.reSize(); });
}

// Parent resize function to handle generic resizing tasks
BaseChart.prototype.reSize = function() {
  // Remove lines
  this.removeSelection('.g-dataLine path');

  // Recompute all parameters that depend on chart width and height
  this.setDerivedParams();

  // Update svg width and height
  this.config.chart.select('.chart-container')
          .attr('width', this.config.outerWidth)
          .attr('height', this.config.outerHeight);

  // Update locations
  this.updateTitleLocation();
  this.updateXAxesLocation();
  this.updateYAxesLocation();
  this.updateLegendLocation();

  // Update axis ranges
  this.setXAxisRange();
  this.setYAxisRange();
  this.setXAxisSpacingRange();
  this.setYAxisSpacingRange();

  // Re-draw axes
  this.generateAxes(this.axes.x, 'x', 0);
  this.generateAxes(this.axes.y, 'y', 0);

  // Re-position x-axis labels
  this.positionXAxisLabel();

  // Update voronoi paths
  this.voronoi.clipExtent([[0, 0], [this.config.width, this.config.height]]);
  this.updateVoronoiPaths();
}


/* RulerChart
 *
 * Chart numeric data across multiple dimensions for multiple data series
 * Each dimension is represented by an independent x-axis with individual domains, minimums and maximums
 * Resembles a 'multiples' chart
 * Alternative to a grouped bar chart when visualizing data across multiple (somewhat) unrelated dimensions
 *
*/

// Define RulerChart class
function RulerChart(args) {
  this.args = args;
  this.setConfig(args); // call config setter inside constructor
}

// Inherit from BaseChart
RulerChart.inheritsFrom(BaseChart);

// RulerChart's draw function
RulerChart.prototype.draw = function() {

  // Call parent draw function for basic chart layout
  this.parent.draw.call(this);

  // Add chart data points
  this.addChartDataPoints();

  // Add voronoi paths
  this.addVoronoiPaths();

  // Carry 'this' context in 'self'
  var self = this;

  // Add listeners to circles
  this.series.selectAll('.g-circle')
      .on('mouseover', function(d) {
          // Call generic mouseover function
          self.circleMouseover(d3.select(this), d);

          // Highlight axes labels
          self.highlightAxis(d, true);
        })
      .on('mouseout', function(d) {
          // Call generic mouseout function
          self.circleMouseout(d3.select(this), d);

          // Unhighlight axis labels
          self.highlightAxis(d, false);
        })
      .on('click', function(d) {
          // Update line class
          self.removeSelection('.mainDataLine');
          self.svg.select('.dataLine').attr('class', 'mainDataLine');

          // Call generic mouseout function
          self.circleMouseout(d3.select(this), d);

          // Recompute x axis domains, centering on data value of clicked circle
          self.recenterDomains(+d.seriesIndex);

          // Transition clicked circle instantaneously to avoid conflicts with listeners
          d3.select(this).attr('transform', 'translate(' + self.scales.x[d.xAxisName](d.xValue) + ',' + self.xAxisSpacing(d.xAxisName) + ')');

          // Re-draw and animate x axes and circles using new domains
          self.reScale();

          // Animate lines
          self.centerMainLineToAxes(d);

          // Unhighlight axis labels
          self.highlightAxis(d, false);

          // Update voronoi paths
          self.updateVoronoiPaths();

          // Display reset button
          self.setElemDisplay('.reset-btn', true);
      });

  // Add listeners to legend
  this.legend
      .on('mouseover', function(p) {
          // Call generic legend mouseover function
          self.legendMouseover(d3.select(this), p);

          // Highlight axis labels
          self.svg.selectAll('.axisLabel').classed('activeText', true);

          // Add line
          // Slight hack in order to re-use the same drawLineToAxes function used for circles
          var obj = {seriesIndex: +p};
          self.drawLineToAxes(obj);
      })
      .on('mouseout', function(p) {
          // Call generic legend mouseout function
          self.legendMouseout(d3.select(this), p);

          // Unhighlight axis labels
          self.svg.selectAll('.axisLabel').classed('activeText', false);

          // Remove lines
          self.removeSelection('.dataLine');
      })
      .on('click', function(p) {
          // Update line class
          self.removeSelection('.mainDataLine');
          self.svg.select('.dataLine').attr('class', 'mainDataLine');

          // Remove labels
          self.removeSelection('.dataLabel');

          // Recompute x axis domains, centering on data value of clicked circle
          self.recenterDomains(+p);

          // Re-draw and animate x axes and circles using new domains
          self.reScale();

          // Animate line
          // Slight hack in order to re-use the same drawLineToAxes function used for circles
          var obj = {seriesIndex: +p};
          self.centerMainLineToAxes(obj);

          // Update voronoi paths
          self.updateVoronoiPaths();

          // Display reset button
          self.setElemDisplay('.reset-btn', true);
      });

  // Reset chart back to original state
  this.resetBtn.on('click', function() {
      // Hide reset button
      self.setElemDisplay('.reset-btn', false);

      // Remove lines and labels
      self.removeSelection('.g-dataLine path');
      self.removeSelection('.dataLabel');

      // Reset x axis domain to original extent
      d3.keys(self.dimensions.x).map(function(p) {
        self.dimensions.x[p].calcs.floorXpx = 0;
        self.scales.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width]).domain(self.dimensions.x[p].calcs.origExtent);
      });

      // Re-draw and animate x axes and circles using new domains
      self.reScale();

      // Update voronoi paths
      self.updateVoronoiPaths();
    });
}

// Overrides BaseChart.pathToAxes()
// Returns the path across dimensions for a given data point (series)
RulerChart.prototype.pathToAxes = function(d) {
  var self = this;
  return self.line(d3.keys(self.dimensions.x).map(function(p) {
                return [self.scales.x[p](self.seriesData[d.seriesIndex].dataObjects.filter(function(dd) { return dd.xAxisName === p; })[0].xValue), self.xAxisSpacing(p)];
          }));
}

// Recomputes domains, centering on passed data
RulerChart.prototype.recenterDomains = function(d) {
  var minMax;
  var centerVal;
  var distFromCenter;
  var maxDistFromCenter;
  var self = this;

  d3.keys(self.dimensions.x).map(function(p) {
      // Reset scale to original state
      self.dimensions.x[p].calcs.floorXpx = 0;
      self.scales.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width])
              .domain(self.dimensions.x[p].calcs.origExtent);

      // Recompute scale, centering on selected series
      minMax = self.scales.x[p].domain();
      centerVal = self.seriesData[d].dataObjects.filter(function(dd) { return dd.xAxisName === p; })[0].xValue;
      distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
      maxDistFromCenter = d3.max(distFromCenter);
      self.scales.x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

      // Adjust for axis floor parameter
      if((centerVal - maxDistFromCenter) < self.dimensions.x[p].parameters.floor)
      {
        self.dimensions.x[p].calcs.floorXpx = self.scales.x[p](self.dimensions.x[p].parameters.floor);
        self.scales.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width])
            .domain([self.dimensions.x[p].parameters.floor, centerVal + maxDistFromCenter]);
      }
  });
}

// Redraws axes and circles
RulerChart.prototype.reScale = function() {
  var self = this;

  self.generateAxes(self.axes.x, 'x', self.config.transition.durationShort);

  self.svg.selectAll('.g-circle')
    .style('pointer-events', 'none')
      .transition()
          .duration(self.config.transition.durationShort)
        .attr('transform', function(d) { return 'translate(' + self.scales.x[d.xAxisName](d.xValue) + ',' + self.xAxisSpacing(d.xAxisName) + ')'; })
        .each('end', function() { d3.select(this).style('pointer-events', null); });
}

// Resizes chart
RulerChart.prototype.reSize = function() {
  // Call parent reSize function
  this.parent.reSize.call(this);

  var self = this;

  // Re-space circles
  this.series.each(function(p) {
    d3.select(this).selectAll('.g-circle')
      .attr('transform', function(d) { return 'translate(' + self.scales.x[d.xAxisName](d.xValue) + ',' + self.xAxisSpacing(d.xAxisName) + ')'; });
  });
}


/* XYPlot
 *
 * Chart numeric data across two dimensions for multiple data series
 * Different from ScatterPlot in expecting a >>single<< data point for each series
 * Focus is on comparing values across series, rather than inferring a relationship between the two dimensions
 * Does not break if provided multiple data points in a series, but interactions will be compromised
 *
*/

// Define XYPlot class
function XYPlot(args) {
  this.args = args;
  this.setConfig(args); // call config setter inside constructor
}

// Inherit from BaseChart
XYPlot.inheritsFrom(BaseChart);

// RulerChart's draw function
XYPlot.prototype.draw = function() {

  // Call parent draw function for basic chart layout
  this.parent.draw.call(this);

  // Add gridlines
  this.addChartGridLines();

  // Add chart data points
  this.addChartDataPoints();

  // Add voronoi paths
  this.addVoronoiPaths();

  // Carry 'this' context in 'self'
  var self = this;

  // Add origin lines at chart draw for all data points
  // Lines fade and disappear as data points reach final location
  this.svg.selectAll('.g-circle').each(function(d) { self.drawLineFromOrigin(d, false, true); });

  // Add circle at origin
  this.addOriginCircle();

  // Add listeners to circles
  this.series.selectAll('.g-circle')
      .on('mouseover', function(d) {
        // Call generic mouseover function
        self.circleMouseover(d3.select(this), d);

        // Add origin lines
        self.drawLineFromOrigin(d, true, false);
      })
      .on('mouseout', function(d) {
        // Call generic mouseout function
        self.circleMouseout(d3.select(this), d);

        // Remove origin line
        self.removeSelection('.originLine');
      })
      .on('click', function(d) {
        // Update line class
        self.removeSelection('.mainDataLine');
        self.removeSelection('.mainOriginLine');
        self.svg.select('.dataLine').attr('class', 'mainDataLine');
        self.svg.select('.originLine').attr('class', 'mainOriginLine');

        // Call generic mouseout function
        self.circleMouseout(d3.select(this), d);

        // Recenter domain on clicked circle
        self.recenterDomains(d);

        // Transition clicked circle instantaneously to avoid conflicts with listeners
        d3.select(this).attr('transform', 'translate(' + self.scales.x[d.xAxisName](d.xValue) + ',' + self.scales.y[d.yAxisName](d.yValue) + ')');

        // Re-draw and animate axes and circles using new domains
        self.reScale();

        // Center main lines
        self.centerMainLineToAxes(d);
        self.centerMainLineFromOrigin(d);

        // Update voronoi paths
        self.updateVoronoiPaths();

        // Display reset button
        self.setElemDisplay('.reset-btn', true);
      });

  // Add listeners to legend
  this.legend
      .on('mouseover', function(p) {
        // Call generic legend mouseover function
        self.legendMouseover(d3.select(this), p);

        // Add lines
        self.series.selectAll('.g-circle')
            .filter(function(d) { return +d.seriesIndex === +p; })
            .each(function(d) {
                self.drawLineToAxes(d);
                self.drawLineFromOrigin(d, true, false);
              });
      })
      .on('mouseout', function(p) {
        // Call generic legend mouseover function
        self.legendMouseout(d3.select(this), p);

        // Remove lines
        self.removeSelection('.dataLine');
        self.removeSelection('.originLine');
      })
      .on('click', function(p) {
        // Call generic legend mouseover function
        self.legendMouseout(d3.select(this), p);

        // Update line class
        // Lines are not data bound (as of now), so this might not be foolproof in ensuring
        // that the selected dataline/originLine will correspond to subsequent circle selection
        self.removeSelection('.mainDataLine');
        self.removeSelection('.mainOriginLine');
        self.svg.select('.dataLine').attr('class', 'mainDataLine');
        self.svg.select('.originLine').attr('class', 'mainOriginLine');
        // Remove remamining lines (needed for when the data series has multiple data points)
        self.removeSelection('.dataLine');
        self.removeSelection('.originLine');

        // Filter for (the first) circle corresponding to selected legend item
        self.series.selectAll('.g-circle')
            .filter(function(d) { return +d.seriesIndex === +p; })
            .filter(function(d, i) { return i < 1; })
            .each(function(d) {
              // Recenter domain
              self.recenterDomains(d);
              // Re-draw and animate axes and circles using new domains
              self.reScale();
              // Center main lines
              self.centerMainLineToAxes(d);
              self.centerMainLineFromOrigin(d);
            });

        // Update voronoi paths
        self.updateVoronoiPaths();

        // Display reset button
        self.setElemDisplay('.reset-btn', true);
      });

  // Reset chart back to original state
  this.resetBtn.on('click', function() {
      // Hide reset button
      self.setElemDisplay('.reset-btn', false);

      // Remove any lines and data labels
      self.removeSelection('.g-dataLine path');
      self.removeSelection('.dataLabel');

      // Reset domanins back to original values
      d3.keys(self.dimensions.x).map(function(p) { self.scales.x[p].domain(self.dimensions.x[p].calcs.origExtent); });
      d3.keys(self.dimensions.y).map(function(p) { self.scales.y[p].domain(self.dimensions.y[p].calcs.origExtent); });
      self.setXAxisSpacingRange();
      self.setYAxisSpacingRange();

      // Re-draw and animate axes and circles using new domains
      self.reScale();

      // Update voronoi paths
      self.updateVoronoiPaths();
    });
}

// Adds invisible circle at origin
XYPlot.prototype.addOriginCircle = function() {
  // Remove existing circle
  this.removeSelection('.origin-circle');

  // Add 'g' element to contain circle
  var originCircle = this.svg.append('g')
                      .attr('class', 'origin-circle')
                      .attr('transform', this.getPaddingTransform());

  var self = this;
  // Add and place circle at origin
  originCircle.append('circle')
          .attr('class', 'circle')
          .attr('r', self.config.radius.normal - 1) // Hack to retain mouseover on centered circle's perimeter
          .style('fill-opacity', 0)
          .attr('transform', function() {
            return 'translate(' + self.scales.x[d3.keys(self.dimensions.x)[0]](self.intercept.x) + ', ' + self.scales.y[d3.keys(self.dimensions.y)[0]](self.intercept.y) + ')';
          });

  // Add listeners to origin circle
  originCircle
      .on('mouseover', function() {
        // Add origin lines for all data points
        self.svg.selectAll('.g-circle').each(function(d) { self.drawLineFromOrigin(d, false, false); });
      })
      .on('mouseout', function(d) {
        // Remove lines
        self.removeSelection('.originLine');
      });
}

// Centers main lines
XYPlot.prototype.centerMainLineFromOrigin = function(d) {
  this.svg.select('.mainOriginLine')
    .transition()
        .duration(this.config.transition.durationShort)
      .attr('d', this.pathFromOrigin(d, false));
}

// Recenters domains on 'd'
XYPlot.prototype.recenterDomains = function(d) {
  var minMax;
  var centerVal;
  var distFromCenter;
  var maxDistFromCenter;
  var self = this;

  d3.keys(self.dimensions).map(function(a) {
    d3.keys(self.dimensions[a]).map(function(p) {
      // Reset scale to original state
      self.scales[a][p].domain(self.dimensions[a][p].calcs.origExtent);

      // Recompute scale, centering on selected series
      minMax = self.scales[a][p].domain();
      centerVal = d[a+'Value'];
      distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
      maxDistFromCenter = d3.max(distFromCenter);
      self.scales[a][p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

      // Set new intercept
      self.intercept[a] = d[a+'Value'];

      // Re-position axes
      var b = (a === 'x') ? 'y' : 'x';
      self[b+'AxisSpacing'].range([self.scales[a][p](centerVal), self.scales[a][p](centerVal)]);
    });
  });
}

// Redraws axes and circles
XYPlot.prototype.reScale = function() {
  // Update axes locations given new intercepts
  this.updateXAxesLocation(this.config.transition.durationShort);
  this.updateYAxesLocation(this.config.transition.durationShort);

  // Re-draw axes
  this.generateAxes(this.axes.x, 'x', this.config.transition.durationShort);
  this.generateAxes(this.axes.y, 'y', this.config.transition.durationShort);

  // Re-draw data points
  var self = this;
  self.svg.selectAll('.g-circle')
    .style('pointer-events', 'none')
      .transition()
          .duration(self.config.transition.durationShort)
        .attr('transform', function(d) { return 'translate(' + self.scales.x[d.xAxisName](d.xValue) + ',' + self.scales.y[d.yAxisName](d.yValue) + ')'; })
        .each('end', function() { d3.select(this).style('pointer-events', null); });

  // Re-draw origin circle
  self.addOriginCircle();

  // Re-draw gridlines
  self.addChartGridLines();
}

// Add lines from origin
XYPlot.prototype.drawLineFromOrigin = function(d, extrapolate, animate) {
  var self = this;

  var path = self.svg.select('.g-dataLine')
              .append('path')
              .attr('class', 'originLine');

  if(!animate) {
    path.attr('d', self.pathFromOrigin(d, extrapolate));
  } else {
    // Animate line from origin to data point; fade out and remove at end of animation
    var origin = [self.yAxisSpacing(d.yAxisName), self.xAxisSpacing(d.xAxisName)];
    path.attr('d', self.line([origin, origin]))
        .transition()
            .delay(self.config.delayScale(d.seriesIndex))
            .duration(self.config.transition.duration)
          .attr('d', self.pathFromOrigin(d, extrapolate))
          .style('stroke-opacity', self.config.opacity.start)
          .remove();
  }
}

// Returns the path from the origin a given data point
XYPlot.prototype.pathFromOrigin = function(d, extrapolate) {
  var coords = [];
  var slope;
  var yExtrapolate;
  var yBound;
  var yDelta;
  var xExtrapolate;
  var xBound;
  var xDelta;
  var self = this;

  // Origin
  coords.push([self.yAxisSpacing(d.yAxisName), self.xAxisSpacing(d.xAxisName)]);

  if(!extrapolate) {
    // Data point
    coords.push([self.scales.x[d.xAxisName](d.xValue), self.scales.y[d.yAxisName](d.yValue)]);
  } else {
    xDelta = d.xValue - self.intercept.x;
    yDelta = d.yValue - self.intercept.y;
    xBound = (xDelta >= 0) ? self.scales.x[d.xAxisName].domain()[1] : self.scales.x[d.xAxisName].domain()[0];
    yBound = (yDelta >= 0) ? self.scales.y[d.yAxisName].domain()[1] : self.scales.y[d.yAxisName].domain()[0];
    slope = yDelta / xDelta;
    if(isFinite(slope)) {
      yExtrapolate = (slope * (xBound - self.intercept.x)) + self.intercept.y;
      if(((yDelta >= 0) && (yExtrapolate <= yBound)) || ((yDelta < 0) && (yExtrapolate >= yBound))) {
        coords.push([self.scales.x[d.xAxisName](xBound), self.scales.y[d.yAxisName](yExtrapolate)]);
      } else {
        xExtrapolate = ((yBound - self.intercept.y) * (1 / slope)) + self.intercept.x;
        coords.push([self.scales.x[d.xAxisName](xExtrapolate), self.scales.y[d.yAxisName](yBound)]);
      }
    }
  }

  return self.line(coords);
}

// Resizes chart
XYPlot.prototype.reSize = function() {
  // Call parent reSize function
  this.parent.reSize.call(this);

  var self = this;

  // Re-space circles
  this.series.each(function(p) {
    d3.select(this).selectAll('.g-circle')
      .attr('transform', function(d) { return 'translate(' + self.scales.x[d.xAxisName](d.xValue) + ',' + self.scales.y[d.yAxisName](d.yValue) + ')'; });
  });

  // Re-draw origin circle
  this.addOriginCircle();

  // Re-draw gridlines
  this.addChartGridLines();
}


/* ScatterPlot
 *
 * Chart numeric data across two dimensions for multiple data series
 * Classic scatter plot; different from XYPlot in expecting multiple (a lot!) data points per series
 * Focus is on inferring relationship between the two dimensions and comparing said relationships across series
 *
*/

// Define ScatterPlot class
function ScatterPlot(args) {
  this.args = args;
  this.setConfig(args); // call config setter inside constructor
}

// Inherit from BaseChart
ScatterPlot.inheritsFrom(BaseChart);

// RulerChart's draw function
ScatterPlot.prototype.draw = function() {

  // Call parent draw function for basic chart layout
  this.parent.draw.call(this);

  // Add gridlines
  this.addChartGridLines();

  // Add chart data points
  this.addChartDataPoints();

  // Add voronoi paths
  this.addVoronoiPaths();

  // Carry 'this' context in 'self'
  var self = this;

  // Add listeners to circles
  this.series.selectAll('.g-circle')
      .on('mouseover', function(d) {
        // Call generic mouseover function
        self.circleMouseover(d3.select(this), d);
      })
      .on('mouseout', function(d) {
        // Call generic mouseout function
        self.circleMouseout(d3.select(this), d);
      })
      .on('click', function(d) {
        // Call generic mouseout function
        self.circleMouseout(d3.select(this), d);

        // Display reset button
        self.setElemDisplay('.reset-btn', true);
      });

  // Add listeners to legend
  this.legend
      .on('mouseover', function(p) {
        // Call generic legend mouseover function
        self.legendMouseover(d3.select(this), p);

        // Add lines
        self.series.selectAll('.g-circle')
            .filter(function(d) { return +d.seriesIndex === +p; })
            .each(function(d) {
                //
                //
              });
      })
      .on('mouseout', function(p) {
        // Call generic legend mouseover function
        self.legendMouseout(d3.select(this), p);
      })
      .on('click', function(p) {
        // Call generic legend mouseover function
        self.legendMouseout(d3.select(this), p);

        // Display reset button
        self.setElemDisplay('.reset-btn', true);
      });

  // Reset chart back to original state
  this.resetBtn.on('click', function() {
      // Hide reset button
      self.setElemDisplay('.reset-btn', false);
    });
}

// Resizes chart
ScatterPlot.prototype.reSize = function() {
  // Call parent reSize function
  this.parent.reSize.call(this);

  var self = this;

  // Re-space circles
  this.series.each(function(p) {
    d3.select(this).selectAll('.g-circle')
      .attr('transform', function(d) { return 'translate(' + self.scales.x[d.xAxisName](d.xValue) + ',' + self.scales.y[d.yAxisName](d.yValue) + ')'; });
  });

  // Re-draw gridlines
  this.addChartGridLines();
}