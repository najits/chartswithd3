/* Helper functions */

// // Fewer Lambdas in D3.js
// // http://phrogz.net/fewer-lambdas-in-d3-js
// function F(name) {
//   var v, params = Array.prototype.slice.call(arguments, 1);
//   return function(o) {
//     return (typeof(v=o[name]) === "function" ? v.apply(o, params) : v);
//   };
// }
// // Returns the first argument passed in
// function I(d) { return d; }

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


/* BaseChart */

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
    colorRange:           ["#37B34A", "#008CCF", "#671E75", "#CB333B", "#ED8B00"],
    baseColor:            "#EBEBEB",
    opacity:              {start: 0.1, end: 0.6},
    // Element sizes
    radius:               {normal: 5, large: 10},
    // Transitions
    transition:           {duration: 1250, durationShort: 1000, delay: 75},
    // Axis
    ticks:                {widthCutoff: 500, upper: 4, lower: 2}
  };

  for(var prop in defaultParams) {
    this.config[prop] = defaultParams[prop];
  }

  // Set color range
  this.setColorRange();

  // Set delay range
  this.setDelayRange();

  // Set width and height params
  this.setWidthHeight();
}

// Computes and sets width/height params from chart width/height
BaseChart.prototype.setWidthHeight = function() {
  // Set outer sizes and compute inner sizes
  this.config.outerWidth = parseInt(this.config.chart.style("width"));
  this.config.outerHeight = parseInt(this.config.chart.style("height"));
  this.config.width = this.config.outerWidth - this.config.margin.left - this.config.margin.right - this.config.padding.left - this.config.padding.right;
  this.config.height = this.config.outerHeight - this.config.margin.top - this.config.margin.bottom - this.config.padding.top - this.config.padding.bottom;

  // Set diagonal length
  this.config.diagonal = this.calculateLength([this.config.width, this.config.height]);

  // Set radius scale domain and range
  this.config.radiusScale
      .domain([0, this.config.diagonal / 2])
      .range([this.config.radius.large, this.config.radius.normal + 1]);

  // Set legend offsets
  this.config.legendOffset.x = this.config.radius.large;
  this.config.legendOffset.y = this.config.radius.large * 3;

  // Set x-axis tick count
  this.axis.ticks(this.tickCount());
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
  return "translate( " + this.config.padding.left + ", " + this.config.padding.top +")";
}

// Public setters for chart parameters and config
BaseChart.prototype.setConfig = function() {
  var chartParent = this.args.chartParent,
      chartData = this.args.chartData,
      chart = d3.select(chartParent);

  // Margins, padding and spacing
  var outerWidth, outerHeight, margin, padding, width, height, diagonal,
      ordinalPadding, legendItemSpacing, legendOffset = {}, dy = {};

  // Color and opacity
  var colorRange, baseColor, opacity,
      colorScale = d3.scale.ordinal(),
      delayScale = d3.scale.linear(),
      radiusScale = d3.scale.sqrt().clamp(true);

  // Element sizes
  var radius;

  // Transitions
  var transition;

  // Axes
  var ticks;

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
    ticks: ticks
  };

  // Set to default params
  this.setToDefaultParams();
}

// Creates SVG chart-container
BaseChart.prototype.addChartContainer = function() {
  this.destroyChart(); // Destroy existing chart first

  this.svg = this.config.chart.append("svg")
                .attr("class", "chart-container")
                .attr("width", this.config.outerWidth)
                .attr("height", this.config.outerHeight)
              .append("g")
                .attr("transform", "translate(" + this.config.margin.left + "," + this.config.margin.top + ")");
}

// Adds chart title
BaseChart.prototype.addChartTitle = function() {
  // Extract chart title
  this.chartTitle = this.config.chartData.chart.title.text;

  // Remove existing title if any
  this.removeSelection(".chartTitle");

  // Add title text
  this.svg.append("g")
        .attr("class", "chartTitle")
        .append("text")
        .text(this.chartTitle)
        .attr("dy", this.config.dy.top + "em");

  // Set title location
  this.updateTitleLocation();
}

// Updates chartTitle location
BaseChart.prototype.updateTitleLocation = function() {
  this.svg.select(".chartTitle")
      .attr("transform","translate( " + (this.config.padding.left + this.config.width + this.config.padding.right) / 2 + ", " + 0 + ")");
}

// Adds chart legend
BaseChart.prototype.addChartLegend = function() {
  var self = this;

  // Remove existing legend if any
  this.removeSelection(".legend");

  // Add legeng 'g' element and set location
  this.svg.append("g").attr("class", "legend");
  this.updateLegendLocation();

  // Bind to seriesData
  this.legend = this.svg.select(".legend")
                  .selectAll(".legendItems")
                    .data(d3.keys(self.seriesData))
                  .enter().append("g")
                    .attr("class", "legendItems");

  // Create and animate legend circles
  this.legend.append("circle")
              .attr("class","legendCircle")
              .attr("r", self.config.radius.normal)
              .attr("cx", self.config.radius.large)
              .attr("cy", function(d, i) { return self.config.legendItemSpacing * i; })
              .style("fill", function(d) { return self.config.colorScale(d); })
              //animated items
              .style({"stroke": self.config.baseColor,
                      "fill-opacity": self.config.opacity.start,
                      "pointer-events": "none"})
                .transition()
                    .delay(function(d) { return self.config.delayScale(d); })
                    .duration(self.config.transition.duration)
                  .style({"stroke": function(d) { return self.config.colorScale(d); },
                          "fill-opacity": self.config.opacity.end})
                  .each("end", function() { d3.select(this).style("pointer-events", null); });

  // Create and animate legend labels
  this.legend.append("text")
              .attr("class","legendLabel")
              .text(function(d) { return self.seriesData[d].name;})
              .attr("y", function(d, i) { return self.config.legendItemSpacing * i; })
              .attr("x", -0.5 * self.config.radius.large)
              .attr("dy", self.config.dy.middle + "em")
              .style("pointer-events", "none")
                .transition()
                    .delay(function(d) { return self.config.delayScale(d); })
                    .duration(self.config.transition.duration)
                  .each("end", function() { d3.select(this).style("pointer-events", null); });
}

// Updates legend location
BaseChart.prototype.updateLegendLocation = function() {
  this.svg.select(".legend").attr("transform", "translate (" + (this.config.padding.left + this.config.width - this.config.legendOffset.x) + ", " + (this.config.padding.top + this.config.height + this.config.legendOffset.y) + ")");
}

// Adds data labels
BaseChart.prototype.addDataLabel = function(d) {
  var self = this;

  // Add x-axis labels
  self.xAxes.filter(function(p) { return p === d.xAxisName; })
            .each(function(p) {
              d3.select(this)
                .append("text")
                .attr("class", "dataLabels x")
                .text(d.xValue.toFixed(2))
                .attr("x", self.x[p](d.xValue))
                .style("text-anchor", "middle")
                .classed("activeText", true);

              if(d3.keys(self.dimensions.x).length > 1) {
                d3.select(this).selectAll(".dataLabels.x")
                    .attr("y", self.config.radius.large * -1.5);
              } else {
                d3.select(this).selectAll(".dataLabels.x")
                    .attr("dy", -1 * self.config.dy.xOffset + "em")
                    .attr("dx", self.config.dy.xOffset + "em");
              }
            });

  // Add y-axis labels if y-axes exist
  if(self.yAxes != null) {
    self.yAxes.filter(function(p) { return p === d.yAxisName; })
            .each(function(p) {
              d3.select(this)
                .append("text")
                .attr("class", "dataLabels y")
                .text(d.yValue.toFixed(2))
                .attr("y", self.y[p](d.yValue))
                .attr("dy", self.config.dy.middle + "em")
                .attr("dx", self.config.dy.xOffset + "em")
                .style("text-anchor", "start")
                .classed("activeText", true);
            });
  }
}

// Remove data labels
BaseChart.prototype.removeDataLabel = function(d) {
  // Remove x-axis labels
  this.xAxes.filter(function(p) { return p === d.xAxisName; }).select(".dataLabels").remove();

  // Remove y-axis labels if y-axes exist
  if(this.yAxes != null) {
    this.yAxes.filter(function(p) { return p === d.yAxisName; }).select(".dataLabels").remove();
  }
}

// Returns number of axis ticks based on chart width
BaseChart.prototype.tickCount = function() {
  return (this.config.width > this.config.ticks.widthCutoff) ? this.config.ticks.upper : this.config.ticks.lower;
}

// Adds reset button to chart
BaseChart.prototype.addResetBtn = function() {
  // Remove existing button if exists
  this.removeSelection(".reset-btn");

  // Add reset button and hide
  this.resetBtn = this.config.chart.append("button")
                    .attr("type","button")
                    .attr("value", "Reset")
                    .attr("class", "reset-btn btn btn-default btn-sm")
                    .html("Reset");

  this.setElemDisplay(".reset-btn", false);
}

// Set button display styles
BaseChart.prototype.setElemDisplay = function(elem, v) {
    if(v) {
      this.config.chart.selectAll(elem).style("display", null);
    } else {
      this.config.chart.selectAll(elem).style("display", "none");
    }
}

// Delete specified selection
BaseChart.prototype.removeSelection = function(elem) { this.config.chart.selectAll(elem).remove(); }

// Destroy all chart elements
BaseChart.prototype.destroyChart = function() {
  this.removeSelection("*");

  // Also remove resize listener for the chart from 'window'
  d3.select(window).on("resize" + "." + this.config.chartParent, null);
}

// Set x-axis range
BaseChart.prototype.setXAxisRange = function() {
  var self = this;
  d3.keys(self.dimensions.x).map(function(p) { self.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width]); });
}

// Set y-axis range
BaseChart.prototype.setYAxisRange = function() {
  var self = this;
  d3.keys(self.dimensions.y).map(function(p) { self.y[p].range([self.config.height, 0]); });
}

// Set x-spacing-in y-range
BaseChart.prototype.setXSpacingInYRange = function() {
  var self = this;

  // If provided multiple x-axes, space x-axes vertically across chart height
  if(d3.keys(self.dimensions.x).length > 1) {
    this.xSpacingInY.rangePoints([0, self.config.height], self.config.ordinalPadding)
  } else {   // Otherwise solve for appropriate y-intercept
    var yAxis = d3.keys(self.dimensions.y)[0];
    var yDomain = self.y[yAxis].domain();
    this.yIntercept = Math.min(Math.max(0, yDomain[0]), yDomain[1]);
    this.xSpacingInY.range([self.y[yAxis](this.yIntercept), self.y[yAxis](this.yIntercept)]);
  }
}

// Set y-spacing-in x-range
BaseChart.prototype.setYSpacingInXRange = function() {
  var self = this;

  if(this.ySpacingInX != null) {
    var xAxis = d3.keys(self.dimensions.x)[0];
    var xDomain = self.x[xAxis].domain();
    this.xIntercept = Math.min(Math.max(0, xDomain[0]), xDomain[1]); // Solve for appropriate x-intercept
    this.ySpacingInX.range([self.x[xAxis](this.xIntercept), self.x[xAxis](this.xIntercept)]);
  }
}

// Process chart data
BaseChart.prototype.processChartData = function() {
  this.dimensions = {};
  this.seriesData = {};
  this.x = {};

  var self = this;

  // Extract xAxis.axes
  if(self.config.chartData.xAxis != null) {
      self.dimensions.x = {};
      self.config.chartData.xAxis.axes.forEach(function(d, i) {
        self.dimensions.x[d.name] = {};
        self.dimensions.x[d.name].type = "x";
        self.dimensions.x[d.name].parameters = d.parameters;
        self.dimensions.x[d.name].dataObjects = [];
        self.dimensions.x[d.name].calcs = {};
        self.dimensions.x[d.name].calcs.floorXpx = 0; // Set floorXpx to 0
        self.x[d.name] = d3.scale.linear();
      })
      self.setXAxisRange();

      // Scale to space x-axes in y dimension
      self.xSpacingInY = d3.scale.ordinal().domain(d3.keys(self.dimensions.x));
  }

  // If provided multiple x-axes, ignore yAxis inputs
  if(!(d3.keys(self.dimensions.x).length > 1)) {
    // Otherwise, extract y-axes and add to dimensions
    if(self.config.chartData.yAxis != null) {
      if(self.config.chartData.yAxis != null) {
          self.dimensions.y = {};
          this.y = {};
          self.config.chartData.yAxis.axes.forEach(function(d, i) {
            self.dimensions.y[d.name] = {};
            self.dimensions.y[d.name].type = "y";
            self.dimensions.y[d.name].parameters = d.parameters;
            self.dimensions.y[d.name].dataObjects = [];
            self.dimensions.y[d.name].calcs = {};
            self.y[d.name] = d3.scale.linear();
          })
          self.setYAxisRange();
      }

      // Scale to space y-axis in x dimension
      self.ySpacingInX = d3.scale.ordinal().domain(d3.keys(self.dimensions.y));
    }
  }

  // Extract series.data
  self.config.chartData.series.data.forEach(function(d, i) {
    self.seriesData[i] = {};    // 'i' serves as unique index for seriesData
    self.seriesData[i].name = d.name;
    self.seriesData[i].dataObjects = [];

    // Processs series.data.data
    d.data.forEach(function(dd, ii) {
      // Check if xAxisName property is defined
      if(dd.xAxisName != null) {
        // Cross-reference against xAxis.axes
        if(self.dimensions.x[dd.xAxisName] != null) {
          // seriesData dataObjects properties are named to differentiate between axis types
          // e.g. xAxisName/xValue and yAxisName/yValue
          var objX = {
            seriesIndex:     i,
            seriesName:      d.name,
            xAxisName:       dd.xAxisName,
            xValue:          dd.x
          };
          self.seriesData[i].dataObjects.push(objX);

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
      // Check if x and y values are defined
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

          var objX = {
            seriesIndex:     i,
            seriesName:      d.name,
            axisName:        xAxisName,
            value:           dd.x
          };
          self.dimensions.x[xAxisName].dataObjects.push(objX);

          var objY = {
            seriesIndex:     i,
            seriesName:      d.name,
            axisName:        yAxisName,
            value:           dd.y
          };
          self.dimensions.y[yAxisName].dataObjects.push(objY);
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

      // Set domains
      var extent = self.dimensions[axisType][axis].calcs.origExtent;
      if(axisType === "x") {
          self.x[axis].domain(extent);
      } else if (axisType === "y") {
          self.y[axis].domain(extent);
      }
    }
  };

  // Set ranages for xSpacingInY and ySpacingInX
  self.setXSpacingInYRange();
  self.setYSpacingInXRange();
}

// Adds x and y axes and axis labels
BaseChart.prototype.addChartAxes = function() {
  var self = this;

  // Process x axes
  if(d3.keys(self.dimensions.x).length > 0) {
      // Add a group element for each x-axis
      self.xAxes = self.svg.selectAll(".x-axis")
                      .data(d3.keys(self.dimensions.x))
                    .enter().append("g")
                      .attr("class", "dimension");
      self.updateXAxesLocation();

      // Add x-axes
      self.xAxes.append("g").attr("class", "axis");
      self.generateAxes(self.xAxes, "x");

      // Add axis labels
      self.xAxes.append("text")
          .attr("class", "axisLabel x")
          .text(function(p) { return self.dimensions.x[p].parameters.displayName; });
      self.positionXAxisLabel();
    }

  // Process y axes
  if(d3.keys(self.dimensions.y).length > 0) {
    // Add a group element for y-axis
    self.yAxes = self.svg.selectAll(".y-axis")
                    .data(d3.keys(self.dimensions.y))
                  .enter().append("g")
                    .attr("class", "dimension");
    self.updateYAxesLocation();

    // Add y-axis
    self.yAxes.append("g").attr("class", "axis");
    self.generateAxes(self.yAxes, "y");

    // Add y-axis labels
    self.yAxes.append("text")
              .attr("class", "axisLabel y")
              .attr("transform", "rotate(-90)")
              .attr("dy", self.config.dy.yOffset + "em")
              .text(function(p) { return self.dimensions.y[p].parameters.displayName; });
  }
}

// Updates x-axis location
BaseChart.prototype.updateXAxesLocation = function(duration) {
  var self = this;
  this.xAxes.transition()
      .duration(function() { return duration ? duration : 0; })
    .attr("transform", function(p) { return "translate( " + self.config.padding.left + ", " + (self.config.padding.top + self.xSpacingInY(p)) + ")"; });
}

// Updates y-axis location
BaseChart.prototype.updateYAxesLocation = function(duration) {
  var self = this;
  if(this.yAxes != null) {
    this.yAxes.transition()
        .duration(function() { return duration ? duration : 0; })
      .attr("transform", function(p) { return "translate( " + (self.config.padding.left + self.ySpacingInX(p)) + ", " + self.config.padding.top + ")"; });
  }
}

// Generates axes on selection
BaseChart.prototype.generateAxes = function(sel, type, duration) {
  var self = this;

  if(duration == null) { duration = self.config.transition.duration; }

  if(sel != null) {
    if(type != null) {
      if(type === "x") {
        orient = "bottom";
        scale = self.x;
      } else if(type === "y") {
        orient = "left";
        scale = self.y;
      }

      sel.selectAll(".axis").each(function(p) {
                                    d3.select(this)
                                      .transition()
                                        .duration(duration)
                                      .call(self.axis.orient(orient).scale(scale[p]));
                                  });
    }
  }
}

BaseChart.prototype.addChartGridLines = function() {
  var self = this;

  // Remove existing gridlines if any
  this.removeSelection(".gridlines");

  // Add a 'g' element to house gridlines
  var gridLines = this.svg.append("g")
                      .attr("class", "gridlines")
                      .attr("transform", this.getPaddingTransform());

  // Get axes ticks; filter out intercepts and domain ends
  var xAxis = d3.keys(self.dimensions.x)[0];
  var xTicks = self.x[xAxis].ticks(self.tickCount())
                            .filter(function(d) {
                                return (d !== self.xIntercept)
                                    && (d !== self.x[xAxis].domain()[0])
                                    && (d !== self.x[xAxis].domain()[1]);
                              });

  var yAxis = d3.keys(self.dimensions.y)[0];
  var yTicks = self.y[yAxis].ticks(self.tickCount())
                            .filter(function(d) {
                                return (d !== self.yIntercept)
                                    && (d !== self.y[yAxis].domain()[0])
                                    && (d !== self.y[yAxis].domain()[1]);
                              });

  // Add grid lines
  gridLines.selectAll("line.grid.x")
                .data(xTicks)
             .enter().append("line")
                .attr({
                        "class": "grid x",
                        "x1": function(d) { return self.x[xAxis](d); },
                        "x2": function(d) { return self.x[xAxis](d); },
                        "y1": 0,
                        "y2": self.config.height
                });

  gridLines.selectAll("line.grid.y")
                .data(yTicks)
             .enter().append("line")
                .attr({
                        "class": "grid y",
                        "x1": 0,
                        "x2": self.config.width,
                        "y1": function(d) { return self.y[yAxis](d); },
                        "y2": function(d) { return self.y[yAxis](d); }
                });

  // Animate
  gridLines.selectAll("line.grid")
    .style("stroke-opacity", 0.0)
     .transition()
         .delay(self.config.transition.durationShort)
         .duration(self.config.transition.durationShort)
        .style("stroke-opacity", self.config.opacity.end);
}

// Position x-axis labels
BaseChart.prototype.positionXAxisLabel = function() {
  if(d3.keys(this.dimensions.x).length > 1) {
    this.xAxes.select(".axisLabel.x")
              .attr("x", -1 * this.config.radius.large);
  } else {
    this.xAxes.select(".axisLabel.x")
              .attr("x", this.config.width)
              .attr("dy", -1 * this.config.dy.xOffset + "em");
  }
}

BaseChart.prototype.yValueRange = function(d) {
  return (d.yAxisName != null) ? this.y[d.yAxisName](d.yValue) : this.xSpacingInY(d.xAxisName);
}

// Adds data points to charts
BaseChart.prototype.addChartDataPoints = function() {
  var self = this;
  var config = this.config;

  // Add g element for each data series
  this.series = this.svg.selectAll(".g-series")
                          .data(d3.keys(self.seriesData))
                        .enter().append("g")
                          .attr("class", "g-series")
                          .attr("transform", this.getPaddingTransform());

  this.series.each(function(p) {
      // Add circles for all series dataObjects
      d3.select(this).selectAll(".g-circle")
        .data(self.seriesData[p].dataObjects)
      .enter().append("g")
        .attr("class", "g-circle")
          .append("circle")
          .attr("class", "circle")
          .attr("r", config.radius.normal)
          .style("fill", function(d) {
              d.circle = this; // http://bl.ocks.org/mbostock/8033015
              return config.colorScale(d.seriesIndex);
            });

      // Animate position
      d3.select(this).selectAll(".g-circle")
        .attr("transform", function(d) {
            // Position circles at intercepts
            var x = (d.yAxisName != null) ? self.ySpacingInX(d.yAxisName) : 0;
            return "translate(" + x + ", " + self.xSpacingInY(d.xAxisName) + ")";
          })
        .transition()
            .delay(function(d) { return config.delayScale(d.seriesIndex); })
            .duration(config.transition.duration)
          .attr("transform", function(d) {
              // Transition circles to xValue/yValue
              return "translate(" + self.x[d.xAxisName](d.xValue) + "," + self.yValueRange(d) + ")";
          });

      // Animate look
      d3.select(this).selectAll(".circle")
        .style({"stroke": config.baseColor,
                "fill-opacity": config.opacity.start,
                "pointer-events": "none"})
        .transition()
            .delay(function(d) { return config.delayScale(d.seriesIndex); })
            .duration(config.transition.duration)
          .style({"stroke": function(d) { return config.colorScale(d.seriesIndex); },
                  "fill-opacity": config.opacity.end})
          .each("end", function() { d3.select(this).style("pointer-events", null); });
  });
}

// Set legend highlight
BaseChart.prototype.setLegendHighlight = function(elem, value) {
  var self = this;
  elem.select(".legendCircle").attr("r", function() { return (value) ? self.config.radius.large: self.config.radius.normal; });
  elem.select(".legendLabel").classed("activeText", value);
}

// Generic circle mouseover events
BaseChart.prototype.circleMouseover = function(elem, d) {
  var self = this;

  // Increase circle radius
  elem.select(".circle").attr("r", this.config.radius.large);

  // Add data label
  this.addDataLabel(d);

  // Highlight legend corresponding to selected circle
  this.legend.filter(function(p) { return +p === +d.seriesIndex; })
      .each(function(p) { self.setLegendHighlight(d3.select(this), true); });
}

// Generic circle mouseout events
BaseChart.prototype.circleMouseout = function(elem, d) {
  var self = this;

  // Return circle radius to normal
  elem.select(".circle").attr("r", this.config.radius.normal);

  // Remove labels
  this.removeDataLabel(d);

  // Un-highlight legend
  this.legend.filter(function(p) { return +p === +d.seriesIndex; })
      .each(function(p) { self.setLegendHighlight(d3.select(this), false); });
}

// Generic legend mouseover events
BaseChart.prototype.legendMouseover = function(elem, p) {
  var self = this;

  // Highlight legend
  this.setLegendHighlight(elem, true);

  // Highlight circles corresponding to selected legend item
  this.series.selectAll(".g-circle")
              .filter(function(d) { return +d.seriesIndex === +p; })
              .each(function(d) {
                d3.select(this).select(".circle").attr("r", self.config.radius.large);
                self.addDataLabel(d);
              });
}

// Generic legend mouseout events
BaseChart.prototype.legendMouseout = function(elem, p) {
  var self = this;

  // Un-highlight legend
  this.setLegendHighlight(elem, false);

  // Un-highlight circles
  this.series.selectAll(".g-circle")
              .filter(function(d) { return +d.seriesIndex === +p; })
              .each(function(d) {
                d3.select(this).select(".circle").attr("r", self.config.radius.normal);
                self.removeDataLabel(d);
              });
}

// Highlight axisLabels matching d's axes
BaseChart.prototype.highlightAxis = function(d, value) {
  this.xAxes.filter(function(p) { return p === d.xAxisName; })
      .select(".axisLabel").classed("activeText", value);

  if(this.yAxes != null) {
    this.yAxes.filter(function(p) { return p === d.yAxisName; })
        .select(".axisLabel").classed("activeText", value);
  };
}

// Draws data line paths
BaseChart.prototype.drawDataLine = function(d) {
  this.svg.append("path")
    .attr("class", "line dataLine")
    .attr("transform", this.getPaddingTransform())
    .attr("d", this.path(d))
    .style("stroke", this.config.colorScale(d.seriesIndex));
}

// Center main data line
BaseChart.prototype.centerMainDataLine = function(d) {
  this.svg.select(".mainDataLine")
    .transition()
        .duration(this.config.transition.durationShort)
      .attr("d", this.path(d));
}

// Returns rolled up data for voronoi maps
BaseChart.prototype.voronoiRollup = function(data) {
  var self = this;

  var rollup = d3.nest()
                .key(function(d) {
                  return self.x[d.xAxisName](d.xValue).toFixed(5) + "," + self.yValueRange(d).toFixed(5);
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
                  .x(function(d) { return self.x[d.xAxisName](d.xValue); })
                  .y(function(d) { return self.yValueRange(d); });

  // Create a 'g' container for voronoi polygons
  this.removeSelection(".voronoi-group");
  var voronoiPaths = this.svg.append("g")
                          .attr("class", "voronoi-group")
                          .attr("transform", this.getPaddingTransform());

  // Add voronoi polygon paths to chart
  voronoiPaths.selectAll(".voronoi-path")
                .data(this.voronoi(this.voronoiRollup(this.allDataPoints)))
              .enter().append("path")
                .attr("class", "voronoi-path")
                .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
                .datum(function(d) { return d.point; });

  // Add simple mouse listeners that highlight related data point circles
  voronoiPaths.selectAll(".voronoi-path")
    .on("mousemove", function(d) {
      var m = d3.mouse(this);
      var a = d3.transform(d3.select(d.circle.parentNode).attr("transform")).translate;
      var length = self.calculateLength(m, a);
      d3.select(d.circle).attr("r", self.config.radiusScale(length));

      // self.svg.selectAll(".voronoi-path").classed("voronoi-path-enabled", true);
      // d3.select(this).classed("voronoi-path-select", true);
    })
    .on("mouseout", function(d) {
      d3.select(d.circle).attr("r", config.radius.normal);
      // self.svg.selectAll(".voronoi-path").classed("voronoi-path-enabled", false);
      // d3.select(this).classed("voronoi-path-select", false);
    });
}

// Transitions/updates voronoi paths
BaseChart.prototype.updateVoronoiPaths = function() {
  this.svg.selectAll(".voronoi-path")
          .data(this.voronoi(this.voronoiRollup(this.allDataPoints)))
          .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
          .datum(function(d) { return d.point; });
}

// Parent draw function to generate basic chart layout
BaseChart.prototype.draw = function() {
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

  // Add a reset button
  this.addResetBtn();
}

// Parent resize function to handle generic resizing tasks
BaseChart.prototype.reSize = function() {
  // Remove lines
  this.removeSelection(".line");

  // Recompute width and height from chart width and height
  this.setWidthHeight();

  // Update svg width and height
  this.config.chart.select(".chart-container")
          .attr("width", this.config.outerWidth)
          .attr("height", this.config.outerHeight);

  // Update locations
  this.updateTitleLocation();
  this.updateXAxesLocation();
  this.updateYAxesLocation();
  this.updateLegendLocation();

  // Update axis ranges
  this.setXAxisRange();
  this.setYAxisRange();
  this.setXSpacingInYRange();
  this.setYSpacingInXRange();

  // Re-draw axes
  this.generateAxes(this.xAxes, "x", 0);
  this.generateAxes(this.yAxes, "y", 0);

  // Re-position x-axis labels
  this.positionXAxisLabel();
}


/* RulerChart */

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

  // Add voronoi paths
  // (before data points in order to retain mouse events on data points)
  this.addVoronoiPaths();

  // Add chart data points
  this.addChartDataPoints();

  // Carry 'this' context in 'self'
  var self = this;

  // Add listeners to circles
  this.series.selectAll(".g-circle")
      .on("mouseover", function(d) {
          // Call generic mouseover function
          self.circleMouseover(d3.select(this), d);

          // Add line connecting dimensions
          self.drawDataLine(d);

          // Highlight axes labels
          self.highlightAxis(d, true);
        })
      .on("mouseout", function(d) {
          // Call generic mouseout function
          self.circleMouseout(d3.select(this), d);

          // Remove lines (exclude 'main' lines)
          self.removeSelection(".dataLine");

          // Unhighlight axis labels
          self.highlightAxis(d, false);
        })
      .on("click", function(d) {
          // Call generic mouseout function
          self.circleMouseout(d3.select(this), d);

          // Update line class
          self.removeSelection(".mainDataLine");
          self.svg.select(".dataLine").attr("class", "line mainDataLine");

          // Recompute x axis domains, centering on data value of clicked circle
          self.recenterDomains(+d.seriesIndex);

          // Transition clicked circle instantaneously to avoid conflicts with listeners
          d3.select(this).attr("transform", "translate(" + self.x[d.xAxisName](d.xValue) + "," + self.xSpacingInY(d.xAxisName) + ")");

          // Re-draw and animate x axes and circles using new domains
          self.reScale();

          // Animate lines
          self.centerMainDataLine(d);

          // Unhighlight axis labels
          self.highlightAxis(d, false);

          // Display reset button
          self.setElemDisplay(".reset-btn", true);

          // Update voronoi paths
          self.updateVoronoiPaths();
      });

  // Add listeners to legend
  this.legend
      .on("mouseover", function(p) {
          // Call generic legend mouseover function
          self.legendMouseover(d3.select(this), p);

          // Highlight axis labels
          self.svg.selectAll(".axisLabel").classed("activeText", true);

          // Add line
          // Slight hack in order to re-use the same drawDataLine function used for circles
          var obj = {seriesIndex: +p};
          self.drawDataLine(obj);
      })
      .on("mouseout", function(p) {
          // Call generic legend mouseout function
          self.legendMouseout(d3.select(this), p);

          // Unhighlight axis labels
          self.svg.selectAll(".axisLabel").classed("activeText", false);

          // Remove lines (exclude 'main' lines)
          self.removeSelection(".dataLine");
      })
      .on("click", function(p) {
          // Update line class
          self.removeSelection(".mainDataLine");
          self.svg.select(".dataLine").attr("class", "line mainDataLine");

          // Remove labels
          self.removeSelection(".dataLabels");

          // Recompute x axis domains, centering on data value of clicked circle
          self.recenterDomains(+p);

          // Re-draw and animate x axes and circles using new domains
          self.reScale();

          // Animate line
          // Slight hack in order to re-use the same drawDataLine function used for circles
          var obj = {seriesIndex: +p};
          self.centerMainDataLine(obj);

          // Display reset button
          self.setElemDisplay(".reset-btn", true);

          // Update voronoi paths
          self.updateVoronoiPaths();
      });

  // Reset chart back to original state
  this.resetBtn.on("click", function() {
      // Hide reset button
      self.setElemDisplay(".reset-btn", false);

      // Remove lines and labels
      self.removeSelection(".line");
      self.removeSelection(".dataLabels");

      // Reset x axis domain to original extent
      d3.keys(self.dimensions.x).map(function(p) {
        self.dimensions.x[p].calcs.floorXpx = 0;
        self.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width]).domain(self.dimensions.x[p].calcs.origExtent);
      });

      // Re-draw and animate x axes and circles using new domains
      self.reScale();

      // Update voronoi paths
      self.updateVoronoiPaths();
    });

  // Resize chart on window resize
  // https://github.com/mbostock/d3/wiki/Selections#on
  // To register multiple listeners for the same event type, the type may be followed by an optional namespace...
  d3.select(window).on("resize" + "." + self.config.chartParent, function() { self.reSize(); });
}

// Returns the path across dimenstions for given data point
RulerChart.prototype.path = function(d) {
  var self = this;
  return self.line(d3.keys(self.dimensions.x).map(function(p) {
                return [self.x[p](self.seriesData[d.seriesIndex].dataObjects.filter(function(dd) { return dd.xAxisName === p; })[0].xValue), self.xSpacingInY(p)];
          }));
}

// Recomputes domains, centering on passed data
RulerChart.prototype.recenterDomains = function(d) {
  var minMax, centerVal, distFromCenter, maxDistFromCenter;
  var self = this;

  d3.keys(self.dimensions.x).map(function(p) {
      // Reset scale to original state
      self.dimensions.x[p].calcs.floorXpx = 0;
      self.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width])
              .domain(self.dimensions.x[p].calcs.origExtent);

      // Recompute scale, centering on selected series
      minMax = self.x[p].domain();
      centerVal = self.seriesData[d].dataObjects.filter(function(dd) { return dd.xAxisName === p; })[0].xValue;
      distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
      maxDistFromCenter = d3.max(distFromCenter);
      self.x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

      // Adjust for axis floor parameter
      if((centerVal - maxDistFromCenter) < self.dimensions.x[p].parameters.floor)
      {
        self.dimensions.x[p].calcs.floorXpx = self.x[p](self.dimensions.x[p].parameters.floor);
        self.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width])
            .domain([self.dimensions.x[p].parameters.floor, centerVal + maxDistFromCenter]);
      }
  });
}

// Redraws axes and circles
RulerChart.prototype.reScale = function() {
  var self = this;

  self.generateAxes(self.xAxes, "x", self.config.transition.durationShort);

  self.svg.selectAll(".g-circle")
    .style("pointer-events", "none")
      .transition()
          .duration(self.config.transition.durationShort)
        .attr("transform", function(d) { return "translate(" + self.x[d.xAxisName](d.xValue) + "," + self.xSpacingInY(d.xAxisName) + ")"; })
        .each("end", function() { d3.select(this).style("pointer-events", null); });
}

// Resizes chart
RulerChart.prototype.reSize = function() {
  // Call parent reSize function
  this.parent.reSize.call(this);

  var self = this;

  // Re-space circles
  this.series.each(function(p) {
    d3.select(this).selectAll(".g-circle")
      .attr("transform", function(d) { return "translate(" + self.x[d.xAxisName](d.xValue) + "," + self.xSpacingInY(d.xAxisName) + ")"; });
  });
}


/* ScatterPlot */

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

  // Add voronoi paths
  // (before data points in order to retain mouse events on data points)
  this.addVoronoiPaths();

  // Add chart data points
  this.addChartDataPoints();

  // Add gridlines
  this.addChartGridLines();

  // Carry 'this' context in 'self'
  var self = this;

  // Add origin lines at chart draw for all data points
  // Lines fade and disappear as data points reach final location
  this.svg.selectAll(".g-circle").each(function(d) { self.drawLineFromOrigin(d, false, true); });

  // Add circle at origin
  this.addOriginCircle();

  // Add listeners to circles
  this.series.selectAll(".g-circle")
      .on("mouseover", function(d) {
        // Call generic mouseover function
        self.circleMouseover(d3.select(this), d);

        // Add data lines
        self.drawDataLine(d);

        // Add origin lines
        self.drawLineFromOrigin(d, true, false);
      })
      .on("mouseout", function(d) {
        // Call generic mouseout function
        self.circleMouseout(d3.select(this), d);

        // Remove lines (exclude "main" lines)
        self.removeSelection(".dataLine");
        self.removeSelection(".originLine");
      })
      .on("click", function(d) {
        // Call generic mouseout function
        self.circleMouseout(d3.select(this), d);

        // Display reset button
        self.setElemDisplay(".reset-btn", true);

        // Update line class
        self.removeSelection(".mainDataLine");
        self.removeSelection(".mainOriginLine");
        self.svg.select(".dataLine").attr("class", "line mainDataLine");
        self.svg.select(".originLine").attr("class", "line mainOriginLine");

        // Recenter domain on clicked circle
        self.recenterDomains(d);

        // Transition clicked circle instantaneously to avoid conflicts with listeners
        d3.select(this).attr("transform", "translate(" + self.x[d.xAxisName](d.xValue) + "," + self.y[d.yAxisName](d.yValue) + ")");

        // Re-draw and animate axes and circles using new domains
        self.reScale();

        // Center main lines
        self.centerMainDataLine(d);
        self.centerMainOriginLine(d);

        // Update voronoi paths
        self.updateVoronoiPaths();
      });

  // Add listeners to legend
  this.legend
      .on("mouseover", function(p) {
        // Call generic legend mouseover function
        self.legendMouseover(d3.select(this), p);

        // Add lines
        self.series.selectAll(".g-circle")
            .filter(function(d) { return +d.seriesIndex === +p; })
            .each(function(d) {
                self.drawDataLine(d);
                self.drawLineFromOrigin(d, true, false);
              });
      })
      .on("mouseout", function(p) {
        // Call generic legend mouseover function
        self.legendMouseout(d3.select(this), p);

        // Remove lines (exclude "main" lines)
        self.removeSelection(".dataLine");
        self.removeSelection(".originLine");
      })
      .on("click", function(p) {
        // Call generic legend mouseover function
        self.legendMouseout(d3.select(this), p);

        // Display reset button
        self.setElemDisplay(".reset-btn", true);

        // Update line class
        // Lines are not data bound (as of now), so this might not be foolproof in ensuring
        // that the selected dataline/originLine will correspond to subsequent circle selection
        self.removeSelection(".mainDataLine");
        self.removeSelection(".mainOriginLine");
        self.svg.select(".dataLine").attr("class", "line mainDataLine");
        self.svg.select(".originLine").attr("class", "line mainOriginLine");
        // Remove remamining lines (needed for when the data series has multiple data points)
        self.removeSelection(".dataLine");
        self.removeSelection(".originLine");

        // Filter for (the first) circle corresponding to selected legend item
        self.series.selectAll(".g-circle")
            .filter(function(d) { return +d.seriesIndex === +p; })
            .filter(function(d, i) { return i < 1; })
            .each(function(d) {
              // Recenter domain
              self.recenterDomains(d);
              // Re-draw and animate axes and circles using new domains
              self.reScale();
              // Center main lines
              self.centerMainDataLine(d);
              self.centerMainOriginLine(d);
            });

        // Update voronoi paths
        self.updateVoronoiPaths();
      });

  // Reset chart back to original state
  this.resetBtn.on("click", function() {
      // Hide reset button
      self.setElemDisplay(".reset-btn", false);

      // Re-display gridlines
      self.setElemDisplay(".gridlines", true);

      // Remove any lines and data labels
      self.removeSelection(".line");
      self.removeSelection(".dataLabels");

      // Reset domanins back to original values
      d3.keys(self.dimensions.x).map(function(p) { self.x[p].domain(self.dimensions.x[p].calcs.origExtent); });
      d3.keys(self.dimensions.y).map(function(p) { self.y[p].domain(self.dimensions.y[p].calcs.origExtent); });
      self.setXSpacingInYRange();
      self.setYSpacingInXRange();

      // Re-draw and animate axes and circles using new domains
      self.reScale();

      // Update voronoi paths
      self.updateVoronoiPaths();
    });

  // Resize chart on window resize
  // https://github.com/mbostock/d3/wiki/Selections#on
  // To register multiple listeners for the same event type, the type may be followed by an optional namespace...
  d3.select(window).on("resize" + "." + self.config.chartParent, function() { self.reSize(); });
}

// Adds invisible circle at origin
ScatterPlot.prototype.addOriginCircle = function() {
  // Remove existing circle
  this.removeSelection(".origin-circle");

  // Add 'g' element to contain circle
  var originCircle = this.svg.append("g")
                      .attr("class", "origin-circle")
                      .attr("transform", this.getPaddingTransform());

  var self = this;
  // Add and place circle at origin
  originCircle.append("circle")
          .attr("class", "circle")
          .attr("r", self.config.radius.normal - 1) // Hack to retain mouseover on centered circle's perimeter
          .style("fill-opacity", 0)
          .attr("transform", function() {
            var x = self.x[d3.keys(self.dimensions.x)[0]](self.xIntercept);
            var y = self.y[d3.keys(self.dimensions.y)[0]](self.yIntercept);
            return "translate(" + x + ", " + y + ")";
          });

  // Add listeners to origin circle
  originCircle
      .on("mouseover", function() {
        // Add origin lines for all data points
        self.svg.selectAll(".g-circle").each(function(d) {
          self.drawLineFromOrigin(d, false, false);
        });
      })
      .on("mouseout", function(d) {
        // Remove lines (exclude "main" lines)
        self.removeSelection(".originLine");
      });
}

// Centers main lines
ScatterPlot.prototype.centerMainOriginLine = function(d) {
  this.svg.select(".mainOriginLine")
    .transition()
        .duration(this.config.transition.durationShort)
      .attr("d", this.originPath(d, false, false));
}

// Recenters domains on 'd'
ScatterPlot.prototype.recenterDomains = function(d) {
  var minMax, centerVal, distFromCenter, maxDistFromCenter;
  var self = this;

  d3.keys(self.dimensions.x).map(function(p) {
    // Reset scale to original state
    self.x[p].domain(self.dimensions.x[p].calcs.origExtent);

    // Recompute scale, centering on selected series
    minMax = self.x[p].domain();
    centerVal = d.xValue;
    distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
    maxDistFromCenter = d3.max(distFromCenter);
    self.x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

    // Respace axis at new intercept
    self.xIntercept = d.xValue;
    self.ySpacingInX.range([self.x[p](d.xValue), self.x[p](d.xValue)]);
  });

  d3.keys(self.dimensions.y).map(function(p) {
    // Reset scale to original state
    self.y[p].domain(self.dimensions.y[p].calcs.origExtent);

    // Recompute scale, centering on selected series
    minMax = self.y[p].domain();
    centerVal = d.yValue;
    distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
    maxDistFromCenter = d3.max(distFromCenter);
    self.y[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

    // Respace axis at new intercept
    self.yIntercept = d.yValue;
    self.xSpacingInY.range([self.y[p](d.yValue), self.y[p](d.yValue)]);
  });
}

// Redraws axes and circles
ScatterPlot.prototype.reScale = function() {
  // Update axes locations given new intercepts
  this.updateXAxesLocation(this.config.transition.durationShort);
  this.updateYAxesLocation(this.config.transition.durationShort);

  // Re-draw axes
  this.generateAxes(this.xAxes, "x", this.config.transition.durationShort);
  this.generateAxes(this.yAxes, "y", this.config.transition.durationShort);

  // Re-draw data points
  var self = this;
  self.svg.selectAll(".g-circle")
    .style("pointer-events", "none")
      .transition()
          .duration(self.config.transition.durationShort)
        .attr("transform", function(d) { return "translate(" + self.x[d.xAxisName](d.xValue) + "," + self.y[d.yAxisName](d.yValue) + ")"; })
        .each("end", function() { d3.select(this).style("pointer-events", null); });

  // Re-draw origin circle
  self.addOriginCircle();

  // Re-draw gridlines
  self.addChartGridLines();
}

// Add lines from origin
ScatterPlot.prototype.drawLineFromOrigin = function(d, extrapolate, animate) {
  var self = this;

  var path = self.svg.append("path")
              .attr("class", "line originLine")
              .attr("transform", this.getPaddingTransform());

  if(!animate) {
    path.attr("d", self.originPath(d, extrapolate));
  } else {
    // Animate line from origin (zero length) to data point; fade out and remove at end of animation
    var origin = [self.ySpacingInX(d.yAxisName), self.xSpacingInY(d.xAxisName)];
    path.attr("d", self.line([origin, origin]))
        .transition()
            .delay(self.config.delayScale(d.seriesIndex))
            .duration(self.config.transition.duration)
          .attr("d", self.originPath(d, extrapolate))
          .style("stroke-opacity", 0.2)
          .each("end", function() { d3.select(this).remove(); });
  }
}

// Returns the path from the origin a given data point
ScatterPlot.prototype.originPath = function(d, extrapolate) {
  var self = this;
  var array = [], slope, yExtrapolate, yBound, yDelta, xExtrapolate, xBound, xDelta;

  // Origin
  array.push([self.ySpacingInX(d.yAxisName), self.xSpacingInY(d.xAxisName)]);

  if(!extrapolate) {
    // Data point
    array.push([self.x[d.xAxisName](d.xValue), self.y[d.yAxisName](d.yValue)]);
  } else {
    xDelta = d.xValue - self.xIntercept;
    yDelta = d.yValue - self.yIntercept;
    xBound = (xDelta >= 0) ? self.x[d.xAxisName].domain()[1] : self.x[d.xAxisName].domain()[0];
    yBound = (yDelta >= 0) ? self.y[d.yAxisName].domain()[1] : self.y[d.yAxisName].domain()[0];
    slope = yDelta / xDelta;
    if(isFinite(slope)) {
      yExtrapolate = (slope * (xBound - self.xIntercept)) + self.yIntercept;
      if(((yDelta >= 0) && (yExtrapolate <= yBound)) || ((yDelta < 0) && (yExtrapolate >= yBound))) {
        array.push([self.x[d.xAxisName](xBound), self.y[d.yAxisName](yExtrapolate)]);
      } else {
        xExtrapolate = ((yBound - self.yIntercept) * (1 / slope)) + self.xIntercept;
        array.push([self.x[d.xAxisName](xExtrapolate), self.y[d.yAxisName](yBound)]);
      }
    }
  }

  return self.line(array);
}

// Returns the path for a given data point
ScatterPlot.prototype.path = function(d) {
  var self = this;
  var array = [];

  array.push([self.ySpacingInX(d.yAxisName), self.y[d.yAxisName](d.yValue)]);
  array.push([self.x[d.xAxisName](d.xValue), self.y[d.yAxisName](d.yValue)]);
  array.push([self.x[d.xAxisName](d.xValue), self.xSpacingInY(d.xAxisName)]);

  return self.line(array);
}

// Resizes chart
ScatterPlot.prototype.reSize = function() {
  // Call parent reSize function
  this.parent.reSize.call(this);

  var self = this;

  // Re-space circles
  this.series.each(function(p) {
    d3.select(this).selectAll(".g-circle")
      .attr("transform", function(d) { return "translate(" + self.x[d.xAxisName](d.xValue) + "," + self.y[d.yAxisName](d.yValue) + ")"; });
  });

  // Re-draw origin circle
  this.addOriginCircle();

  // Re-draw gridlines
  this.addChartGridLines();

  // Update voronoi paths
  this.voronoi.clipExtent([[0, 0], [self.config.width, self.config.height]])
  this.updateVoronoiPaths();
}
