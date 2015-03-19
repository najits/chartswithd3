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

// Fewer Lambdas in D3.js
// http://phrogz.net/fewer-lambdas-in-d3-js
function F(name) {
  var v, params = Array.prototype.slice.call(arguments, 1);
  return function(o) {
    return (typeof(v=o[name]) === "function" ? v.apply(o, params) : v);
  };
}
// Returns the first argument passed in
function I(d) { return d; }


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
    radius:               {normal: 7, large: 10},
    // Transitions
    transition:           {duration: 1250, durationShort: 500, delay: 100},
    // Axis
    ticks:                {widthCutoff: 500, upper: 4, lower: 2}
  };

  for(var prop in defaultParams) {
    this.config[prop] = defaultParams[prop];
  }

  // Set color range
  this.setColorRange();

  // Set width and height params
  this.setWidthHeight();
}

// Computes and sets width/height params from chart width/height
BaseChart.prototype.setWidthHeight = function() {
  this.config.outerWidth = parseInt(this.config.chart.style("width"));
  this.config.outerHeight = parseInt(this.config.chart.style("height"));
  this.config.width = this.config.outerWidth - this.config.margin.left - this.config.margin.right - this.config.padding.left - this.config.padding.right;
  this.config.height = this.config.outerHeight - this.config.margin.top - this.config.margin.bottom - this.config.padding.top - this.config.padding.bottom;

  this.config.legendOffset.x = this.config.radius.large;
  this.config.legendOffset.y = 3 * this.config.radius.large;

  // Set x-axis tick count
  this.axis.ticks(this.tickCount());
}

// Set color range
BaseChart.prototype.setColorRange = function() {
  this.config.colorScale.range(this.config.colorRange);
}

// Public setters for chart parameters and config
BaseChart.prototype.setConfig = function() {
  var chartParent = this.args.chartParent,
      chartData = this.args.chartData,
      chart = d3.select(chartParent);

  // Margins, padding and spacing
  var outerWidth, outerHeight, margin, padding, width, height,
      ordinalPadding, legendItemSpacing, legendOffset = {}, dy = {};

  // Color and opacity
  var colorRange, baseColor, opacity,
      colorScale = d3.scale.ordinal();

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

  this.removeSelection(".chartTitle");

  this.svg.append("g")
        .attr("class", "chartTitle")
        .append("text")
        .text(this.chartTitle)
        .attr("dy", this.config.dy.top + "em");

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

  this.removeSelection(".legend");

  this.svg.append("g").attr("class", "legend");
  this.updateLegendLocation();

  this.legend = this.svg.select(".legend")
                  .selectAll(".legendItems")
                    .data(d3.keys(self.seriesData))
                  .enter().append("g")
                    .attr("class", "legendItems");

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
                  .delay(function(d, i) { return i * self.config.transition.delay; })
                  .duration(self.config.transition.duration)
                .style({"stroke": function(d) { return self.config.colorScale(d); },
                        "fill-opacity": self.config.opacity.end})
                .each("end", function() { d3.select(this).style("pointer-events", null); });

  this.legend.append("text")
              .attr("class","legendLabel")
              .text(function(d) { return self.seriesData[d].name;})
              .attr("y", function(d, i) { return self.config.legendItemSpacing * i; })
              .attr("x", -0.5 * self.config.radius.large)
              .attr("dy", self.config.dy.middle + "em")
              .style("pointer-events", "none")
                .transition()
                  .delay(function(d, i) { return i * self.config.transition.delay; })
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
                .classed("activeText", true);
            });

  if(d3.keys(self.dimensions.x).length > 1) {
    self.xAxes.selectAll(".dataLabels.x")
        .attr("y", self.config.radius.large * -1.5)
        .style("text-anchor", "middle");
  } else {
    self.xAxes.selectAll(".dataLabels.x")
        .attr("dy", -1 * self.config.dy.xOffset + "em")
        .attr("dx", self.config.dy.xOffset + "em")
        .style("text-anchor", "start");
  }

  // Add y-axis labels if y-axes exist
  if(self.yAxes != null) {
    self.yAxes.filter(function(p) { return p === d.yAxisName; })
            .each(function(p) {
              d3.select(this)
                .append("text")
                .attr("class", "dataLabels y")
                .text(d.yValue.toFixed(2))
                .attr("y", self.y[p](d.yValue))
                .attr("dy", (self.config.dy.top + self.config.dy.xOffset) + "em")
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
    this.removeSelection(".reset-btn");
    this.resetBtn = this.config.chart.append("input")
                      .attr("type","button")
                      .attr("value", "Reset")
                      .attr("class", "reset-btn btn btn-sm");
    this.setBtnDisplay(this.resetBtn, false);
}

// Set button display styles
BaseChart.prototype.setBtnDisplay = function(btn, v) {
    if(v) {
      btn.style("display", null);
    } else {
      btn.style("display", "none");
    }
}

// Delete specified selection
BaseChart.prototype.removeSelection = function(elem) { this.config.chart.selectAll(elem).remove(); }

// Destroy all chart elements
BaseChart.prototype.destroyChart = function() {
  var self = this;
  self.removeSelection("*");
  d3.select(window).on("resize" + "." + self.config.chartParent, null); //remove resize listener for this chart from 'window'
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

// Set x-spacing-iny range
BaseChart.prototype.setXSpacingInYRange = function() {
  var self = this;
  // If provided multiple x-axes, space x-axes vertically across chart height
  // Otherwise fix to bottom of chart
  if(d3.keys(this.dimensions.x).length > 1) {
    this.xSpacingInY.rangePoints([0, this.config.height], this.config.ordinalPadding)
  } else {
    this.xSpacingInY.range([this.config.height, this.config.height]);
  }
}

// Process chart data
BaseChart.prototype.processChartData = function() {
  this.dimensions = {};
  this.seriesData = {};
  this.x = {};
  this.xSpacingInY = {};

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
      self.xSpacingInY = d3.scale.ordinal().domain(d3.keys(self.dimensions.x));
      self.setXSpacingInYRange();
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
}

// Updates x-axis locations
BaseChart.prototype.updateXAxesLocation = function() {
  var self = this;
  this.xAxes.attr("transform", function(p) { return "translate( " + self.config.padding.left + ", " + (self.config.padding.top + self.xSpacingInY(p)) + ")"; });
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

// Adds x and y axes
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
                    .attr("class", "dimension")
                    .attr("transform", "translate( " + self.config.padding.left + ", " + self.config.padding.top + ")");

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

// Adds data points to charts
BaseChart.prototype.addChartDataPoints = function() {
  var self = this;
  var config = this.config;

  // Add g element for each data series
  this.series = this.svg.selectAll(".g-series")
                          .data(d3.keys(self.seriesData))
                        .enter().append("g")
                          .attr("class", "g-series")
                          .attr("transform", "translate( " + self.config.padding.left + ", " + self.config.padding.top + ")");

  this.series.each(function(p) {
      d3.select(this).selectAll(".g-circle")
        .data(self.seriesData[p].dataObjects)
      .enter().append("g")
        .attr("class", "g-circle")
        .attr("transform", function(d) { return "translate(0, " + self.xSpacingInY(d.xAxisName) + ")"; })
          .append("circle")
          .attr("class", "circle")
          .attr("r", config.radius.normal)
          .style({"stroke": config.baseColor,
                  "fill-opacity": config.opacity.start,
                  "fill": function(d) { return config.colorScale(d.seriesIndex); },
                  "pointer-events": "none"});

      d3.select(this).selectAll(".g-circle")
        .transition()
          .delay(function(d, i) { return i * config.transition.delay; })
          .duration(config.transition.duration)
        .attr("transform", function(d) {
            // If yAxisName is not defined, chart is assumed to only have x-axes (keep y unchanged)
            var y = (d.yAxisName != null) ? self.y[d.yAxisName](d.yValue) : self.xSpacingInY(d.xAxisName);
            return "translate(" + self.x[d.xAxisName](d.xValue) + "," + y + ")";
        });

      d3.select(this).selectAll(".circle")
        .transition()
          .delay(function(d, i) { return i * config.transition.delay; })
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
  elem.select(".circle").attr("r", self.config.radius.large);

  // Add data label
  self.addDataLabel(d);

  // Highlight legend corresponding to selected circle
  self.legend.filter(function(p) { return +p === +d.seriesIndex; })
      .each(function(p) {
          self.setLegendHighlight(d3.select(this), true);
      });
}

// Generic circle mouseout events
BaseChart.prototype.circleMouseout = function(elem, d) {
  var self = this;

  // Return circle radius to normal
  elem.select(".circle").attr("r", self.config.radius.normal);

  // Remove labels
  self.removeDataLabel(d);

  // Un-highlight legend
  self.legend.filter(function(p) { return +p === +d.seriesIndex; })
      .each(function(p) {
          self.setLegendHighlight(d3.select(this), false);
      });
}

// Generic legend mouseover events
BaseChart.prototype.legendMouseover = function(elem, p) {
  var self = this;

  // Highlight legend
  this.setLegendHighlight(elem, true);

  // Highlight circles corresponding to selected legend item
  this.svg.selectAll(".g-circle")
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
  this.svg.selectAll(".g-circle")
              .filter(function(d) { return +d.seriesIndex === +p; })
              .each(function(d) {
                d3.select(this).select(".circle").attr("r", self.config.radius.normal);
                self.removeDataLabel(d);
              });
}

// Removes all lines except the main line
BaseChart.prototype.removeLines = function() {
    this.svg.selectAll(".line")
      .filter(function() { return d3.select(this).attr("class") != "line main"; }).remove();
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

// Draws path
BaseChart.prototype.drawLine = function(d) {
  var self = this;
  self.svg.append("path")
    .attr("class", "line")
    .attr("transform", "translate( " + self.config.padding.left + ", " + self.config.padding.top +")")
    .attr("d", self.path(d))
    .style("pointer-events", "none")
    .style("stroke", self.config.colorScale(d.seriesIndex));
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
}

// Parent resize function to handle generic resizing tasks
BaseChart.prototype.reSize = function() {
  // Recompute width and height from chart width and height
  this.setWidthHeight();

  // Update svg width and height
  this.config.chart.select(".chart-container")
          .attr("width", this.config.outerWidth)
          .attr("height", this.config.outerHeight);

  // Update locations
  this.updateTitleLocation();
  this.updateXAxesLocation();
  this.updateLegendLocation();

  // Update axis ranges
  this.setXAxisRange();
  this.setYAxisRange();
  this.setXSpacingInYRange();

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

  this.addResetBtn();
  var resetBtn = this.resetBtn;

  // Add data points
  this.addChartDataPoints();

  // Carry 'this' context in 'self'
  var self = this;

  // Add listeners to circles
  this.svg.selectAll(".g-circle")
      .on("mouseover", function(d) {
          // Call generic mouseover function
          self.circleMouseover(d3.select(this), d);

          // Add line connecting dimensions.
          self.drawLine(d);

          // Highlight axes labels
          self.highlightAxis(d, true);
        })
      .on("mouseout", function(d) {
          // Call generic mouseout function
          self.circleMouseout(d3.select(this), d);

          // Remove lines.
          self.removeLines();

          // Unhighlight axis labels.
          self.highlightAxis(d, false);
        })
      .on("click", function(d) {
          // Call generic mouseout function
          self.circleMouseout(d3.select(this), d);

          // Update line class in order to retain.
          self.setMainLine();

          // Recompute x axis domains, centering on data value of clicked circle.
          self.recenterDomains(+d.seriesIndex);

          // Transition clicked circle instantaneously to avoid conflicts with listeners.
          d3.select(this).attr("transform", "translate(" + self.x[d.xAxisName](d.xValue) + "," + self.xSpacingInY(d.xAxisName) + ")");

          // Re-draw and animate x axes and circles using new domains.
          self.reScale();

          // Animate lines.
          self.centerMainLine(d);

          // Unhighlight axis labels.
          self.highlightAxis(d, false);

          // Display reset button.
          self.setBtnDisplay(resetBtn, true);
      });

  // Add listeners to legend
  this.svg.selectAll(".legendItems")
      .on("mouseover", function(p) {
          // Call generic legend mouseover function
          self.legendMouseover(d3.select(this), p);

          // Highlight axis labels
          self.svg.selectAll(".axisLabel").classed("activeText", true);

          // Add line
          // Slight hack in order to re-use the same drawLine function used for circles
          var obj = {seriesIndex: +p};
          self.drawLine(obj);
      })
      .on("mouseout", function(p) {
          // Call generic legend mouseout function
          self.legendMouseout(d3.select(this), p);

          // Unhighlight axis labels
          self.svg.selectAll(".axisLabel").classed("activeText", false);

          // Remove lines
          self.removeLines();
      })
      .on("click", function(p) {
          // Update line class in order to retain
          self.setMainLine();

          // Remove labels
          self.removeSelection(".dataLabels");

          // Recompute x axis domains, centering on data value of clicked circle
          self.recenterDomains(+p);

          // Re-draw and animate x axes and circles using new domains
          self.reScale();

          // Animate line
          // Slight hack in order to re-use the same drawLine function used for circles
          var obj = {seriesIndex: +p};
          self.centerMainLine(obj);

          // Display reset button
          self.setBtnDisplay(resetBtn, true);
      });

  // Reset chart to original scale on button click
  resetBtn.on("click", function() {
      // Hide reset button
      self.setBtnDisplay(resetBtn, false);

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

// Sets main line class
RulerChart.prototype.setMainLine = function() {
  this.svg.select(".line.main").remove();
  this.svg.select(".line").attr("class", "line main");
}

// Recomputes domains, centering on passed data
RulerChart.prototype.recenterDomains = function(d) {
  var minMax, centerVal, distFromCenter, maxDistFromCenter;
  var self = this;

  d3.keys(self.dimensions.x).map(function(p) {
      // Reset scale to original state
      self.dimensions.x[p].calcs.floorXpx = 0;
      self.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width]).domain(self.dimensions.x[p].calcs.origExtent);

      // Recompute scale, centering on selected series
      minMax = self.x[p].domain();
      centerVal = self.seriesData[d].dataObjects.filter(function(dd) { return dd.xAxisName === p; })[0].xValue;
      distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
      maxDistFromCenter = d3.max(distFromCenter);
      self.x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

      // Adjust for axis floor parameter
      if((centerVal - maxDistFromCenter) < self.dimensions.x[p].parameters.floor) {
        self.dimensions.x[p].calcs.floorXpx = self.x[p](self.dimensions.x[p].parameters.floor);
        self.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width]).domain([self.dimensions.x[p].parameters.floor, centerVal + maxDistFromCenter]);
      }
  });
}

// Redraws axes and circles
RulerChart.prototype.reScale = function() {
  var self = this;

  self.generateAxes(self.xAxes, "x", self.config.transition.durationShort);

  self.series.each(function(p) {
    d3.select(this).selectAll(".g-circle")
      .style("pointer-events", "none")
        .transition()
          .duration(self.config.transition.durationShort)
        .attr("transform", function(d) { return "translate(" + self.x[d.xAxisName](d.xValue) + "," + self.xSpacingInY(d.xAxisName) + ")"; })
        .each("end", function() { d3.select(this).style("pointer-events", null); });
  });
}

// Centers the main line
RulerChart.prototype.centerMainLine = function(d) {
  var self = this;
  this.svg.select(".line.main")
    .transition()
      .duration(self.config.transition.durationShort)
    .attr("d", self.path(d));
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

  // Remove centered line (unsuccessful in figuring out how to rescale)
  this.svg.select(".line.main").remove();
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

  // Add data points
  this.addChartDataPoints();

  // Carry 'this' context in 'self'
  var self = this;

  this.svg.selectAll(".g-circle")
      .on("mouseover", function(d) {
        // Call generic mouseover function
        self.circleMouseover(d3.select(this), d);

        // Draw lines
        self.drawLine(d);
      })
      .on("mouseout", function(d) {
        // Call generic mouseout function
        self.circleMouseout(d3.select(this), d);

        // Remove lines.
        self.removeLines();
      })
      .on("click", function(d) {
        // Call generic mouseout function
        // self.circleMouseout(d3.select(this), d);
      });

  this.svg.selectAll(".legendItems")
      .on("mouseover", function(p) {
        // Call generic legend mouseover function
        self.legendMouseover(d3.select(this), p);

        // Add lines
        self.svg.selectAll(".g-circle")
            .filter(function(d) { return +d.seriesIndex === +p; })
            .each(function(d) { self.drawLine(d); });
      })
      .on("mouseout", function(p) {
        // Call generic legend mouseover function
        self.legendMouseout(d3.select(this), p);

        // Remove lines.
        self.removeLines();
      })
      .on("click", function(p) {
      });

  // Resize chart on window resize
  // https://github.com/mbostock/d3/wiki/Selections#on
  // To register multiple listeners for the same event type, the type may be followed by an optional namespace...
  d3.select(window).on("resize" + "." + self.config.chartParent, function() { self.reSize(); });
}

// Returns the path for a given data point
ScatterPlot.prototype.path = function(d) {
  var self = this;
  var array = [];

  array.push([0, self.y[d.yAxisName](d.yValue)]);
  array.push([self.x[d.xAxisName](d.xValue), self.y[d.yAxisName](d.yValue)]);
  array.push([self.x[d.xAxisName](d.xValue), self.config.height]);

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
}
