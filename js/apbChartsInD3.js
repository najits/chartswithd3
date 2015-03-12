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
    padding:              {left: 100, right: 50, top: 50, bottom: 100},
    ordinalPadding:       0.5,
    legendSpacing:        18,
    // Color and opacity
    colorRange:           ["#37B34A", "#008CCF", "#671E75", "#CB333B", "#ED8B00"],
    baseColor:            "#EBEBEB",
    opacity:              {start: 0.1, end: 0.6},
    // Element sizes
    radius:               {normal: 7, large: 10},
    // Transitions
    transition:           {duration: 1250, durationShort: 500, delay: 100}
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
}

// Set color range
BaseChart.prototype.setColorRange = function() { this.config.color.range(this.config.colorRange); }

// Public setters for chart parameters and config
BaseChart.prototype.setConfig = function() {
  var chartParent = this.args.chartParent,
      chartData = this.args.chartData,
      chart = d3.select(chartParent);

  // Margins, padding and spacing
  var outerWidth, outerHeight, margin, padding, width, height,
      ordinalPadding, legendSpacing;

  // Color and opacity
  var colorRange, baseColor, opacity,
      color = d3.scale.ordinal();

  // Element sizes
  var radius;

  // Transitions
  var transition;

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
    legendSpacing: legendSpacing,
    colorRange: colorRange,
    color: color,
    baseColor: baseColor,
    opacity: opacity,
    radius: radius,
    transition: transition
  };

  // Set to default params
  this.setToDefaultParams();
}

// Public getters for chart parameters and config
BaseChart.prototype.getConfig = function() { return this.config; };

// Creates SVG chart-container
BaseChart.prototype.addChartContainer = function() {
  this.removeSelection("__ALL__"); // Destroy chart first

  this.svg = this.config.chart.append("svg")
                .attr("class", "chart-container")
                .attr("width", this.config.outerWidth)
                .attr("height", this.config.outerHeight)
              .append("g")
                .attr("transform", "translate(" + this.config.margin.left + "," + this.config.margin.top + ")");
}

// Process chart data
BaseChart.prototype.processChartData = function () {
  this.displayName = {};
  this.categories = [];
  this.dimensions = [];
  this.dataSeries = {};
  this.categoryData = {};
  this.origExtent = {};
  this.floor = {};
  this.floorXpx = {};
  this.x = {};

  var self = this;
  var data = self.config.chartData;

  // Extract categories
  data.xAxis.categories.forEach(function(d, i) {
    self.categories.push(d);
    self.categoryData[d] = {};
  });
  // Map colors to categories
  self.config.color.domain(self.categories);

  // Process data series
  data.series.forEach(function(d, i) {
    self.dimensions.push(d.name); //array containing list of dimensions

    self.displayName[d.name] = d.parameters.displayName;

    self.floorXpx[d.name] = 0;
    self.floor[d.name] = d.parameters.floor;

    self.origExtent[d.name] = d3.extent(d.data, I);
    self.origExtent[d.name][0] = d3.min([self.origExtent[d.name][0], d.parameters.min]);
    self.origExtent[d.name][1] = d3.max([self.origExtent[d.name][1], d.parameters.max]);

    self.dataSeries[d.name] = [];
    var obj = {};
    d.data.forEach(function(dd, ii) {
      // Data by category
      self.categoryData[self.categories[ii]][d.name] = dd;

      // Data object relating category and series to value
      obj = {
        category: self.categories[ii],
        series: d.name,
        value: dd
      };

      // Data by series
      self.dataSeries[d.name].push(obj);
    });

    // X-scales for each dimension
    self.x[d.name] = d3.scale.linear()
                        .range([self.floorXpx[d.name], self.config.width])
                        .domain(self.origExtent[d.name]);
  });

  // Y-scale for dimensions
  self.y = d3.scale.ordinal()
              .rangePoints([0, self.config.height], self.config.ordinalPadding)
              .domain(self.dimensions);
}

// Adds chart title
BaseChart.prototype.addChartTitle = function() {
  // Extract chart title
  this.chartTitle = this.args.chartData.chart.title.text;

  this.svg.append("g")
        .attr("class", "chartTitle")
        .attr("transform","translate( " + (this.config.padding.left + this.config.width + this.config.padding.right) / 2 + ", " + (this.config.padding.top / 2) + ")")
          .append("text")
          .text(this.chartTitle);
}

// Adds chart legend
BaseChart.prototype.addChartLegend = function() {
  var self = this;

  this.legend = this.svg.append("g")
                  .attr("class", "legend")
                  .attr("transform","translate (" + (this.config.padding.left + this.config.width - this.config.radius.large) + ", " + (this.config.padding.top + this.config.height + this.config.radius.large) + ")")
                  .selectAll(".legendItems")
                    .data(self.categories)
                  .enter().append("g")
                    .attr("class", "legendItems");

  this.legend.append("circle")
              .attr("class","legendCircle")
              .attr("r", self.config.radius.normal)
              .attr("cx", self.config.radius.large)
              .attr("cy", function(d, i) { return self.config.legendSpacing * i; })
              .style("fill", function(d) { return self.config.color(d); })
              //animated items
              .style({"stroke": self.config.baseColor,
                      "fill-opacity": self.config.opacity.start,
                      "pointer-events": "none"})
                .transition()
                  .delay(function(d, i) { return i * self.config.transition.delay; })
                  .duration(self.config.transition.duration)
                .style({"stroke": function(d) { return self.config.color(d); },
                        "fill-opacity": self.config.opacity.end})
                .each("end", function() { d3.select(this).style("pointer-events", null); });

  this.legend.append("text")
              .attr("class","legendLabel")
              .text(I)
              .attr("y", function(d, i) { return self.config.legendSpacing * i; })
              .attr("x", -0.5 * self.config.radius.large)
              .attr("dy", "0.35em")
              .style("pointer-events", "none")
                .transition()
                  .delay(function(d, i) { return i * self.config.transition.delay; })
                  .duration(self.config.transition.duration)
                .each("end", function() { d3.select(this).style("pointer-events", null); });
}

// Adds data labels.
BaseChart.prototype.addLabel = function(elem) {
  var self = this;
  elem.append("text")
      .attr("class", "dataLabels")
      .attr("y", -1.5 * self.config.radius.large)
      .text(function(d) { return d.value.toFixed(2); })
      .classed("activeText", true);
}

// Returns number of axis ticks based on chart width.
BaseChart.prototype.tickCount = function() { return this.config.width > 600 ? 4 : 2; }

// Adds reset button to chart div
BaseChart.prototype.addResetBtn = function() {
    this.resetBtn = this.config.chart.append("input")
                      .attr("type","button")
                      .attr("value", "Reset")
                      .attr("class", "reset-btn btn btn-sm");

    return this.resetBtn;
}

// Function to set button display styles
BaseChart.prototype.setBtnDisplay = function(btn, v) {
    if(v) {
      btn.style("display", null);
    } else {
      btn.style("display", "none");
    }
}

// Function to remove specified selection
BaseChart.prototype.removeSelection = function(elem) {
  var select = (elem === "__ALL__") ? "*" : elem;
  this.config.chart.selectAll(select).remove();
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

  // Get chart config
  var config = this.getConfig();

  // Create SVG to house chart
  this.addChartContainer();
  var svg = this.svg;

  // Add reset button and hide
  var resetBtn = this.addResetBtn();
  this.setBtnDisplay(resetBtn, false);

  // Set x-axis tick count
  this.axis.ticks(this.tickCount());

  // Process chart data and create x/y scales
  this.processChartData();

  // Add chart title
  this.addChartTitle();

  // Carry RulerChart 'this' context in 'self'
  var self = this;

  // Add a group element for each dimension.
  self.g = svg.selectAll(".dimension")
                .data(self.dimensions)
              .enter().append("g")
                .attr("class", "dimension")
                .attr("transform", function(p) {
                  return "translate( " + config.padding.left + ", " + (config.padding.top + self.y(p)) + ")";
                });

  // Add axes.
  self.g.append("g")
        .attr("class", "axis")
        .each(function(p) {
          d3.select(this)
            .transition()
              .duration(config.transition.duration)
            .call(self.axis.scale(self.x[p]));
        });

  // Add titles.
  self.g.append("text")
        .attr("class", "axisLabel")
        .attr("x", -1 * config.radius.large)
        .text(function(p) { return self.displayName[p]; });

  // Add and animate circles on each dimension.
  self.g.each(function(p) {
    d3.select(this).selectAll(".g-circle")
      .data(self.dataSeries[p])
    .enter().append("g")
      .attr("class", "g-circle")
      .attr("transform", "translate(0, 0)")
        .append("circle")
        .attr("class", "circle")
        .attr("r", config.radius.normal)
        .attr("cx", 0)
        .style({"stroke": config.baseColor,
                "fill-opacity": config.opacity.start,
                "fill": function(d) { return config.color(d.category); },
                "pointer-events": "none"});

    d3.select(this).selectAll(".g-circle")
      .transition()
        .delay(function(d, i) { return i * config.transition.delay; })
        .duration(config.transition.duration)
      .attr("transform", function(d) { return "translate(" + self.x[p](d.value) + "," + 0 + ")"; });

    d3.select(this).selectAll(".circle")
      .transition()
        .delay(function(d, i) { return i * config.transition.delay; })
        .duration(config.transition.duration)
      .style({"stroke": function(d) { return config.color(d.category); },
              "fill-opacity": config.opacity.end})
      .each("end", function() { d3.select(this).style("pointer-events", null); });
  });

  // Add legend.
  self.addChartLegend();

  // Add listeners to circles.
  svg.selectAll(".g-circle")
      .on("mouseover", function(d) {
          // Increase circle radius
          d3.select(this).select(".circle").attr("r", config.radius.large);

          // Add data label
          self.addLabel(d3.select(this));

          // Highlight related dimension's axis label
          d3.select(this.parentNode).select(".axisLabel").classed("activeText", true);

          // Highlight legend.
          self.legend.filter(function(p) { return p === d.category; })
              .each(function(p) {
                d3.select(this).select(".legendCircle").attr("r", config.radius.large);
                d3.select(this).select(".legendLabel").classed("activeText", true);
              });

          // Add line connecting dimensions.
          self.drawLine(d);
        })
      .on("mouseout", function() {
          // Unanimate circle radius.
          d3.select(this).select(".circle").attr("r", config.radius.normal);

          // Remove labels
          self.removeSelection(".dataLabels");

          // Unhighlight legend and axis label
          self.legend.selectAll(".legendCircle").attr("r", config.radius.normal);
          self.legend.selectAll(".legendLabel").classed("activeText", false);

          // Unhighlight axis labels.
          svg.selectAll(".axisLabel").classed("activeText", false);

          // Remove lines.
          self.removeLines();
        })
      .on("click", function(d) {
          // Update line class in order to retain.
          self.setMainLine();

          // Remove labels
          self.removeSelection(".dataLabels");

          // Recompute x axis domains, centering on data value of clicked circle.
          self.recenterDomains(d);

          // Transition clicked circle instantaneously to avoid conflicts with listeners.
          d3.select(this).attr("transform", "translate(" + self.x[d.series](d.value) + "," + 0 + ")");

          // Re-draw and animate x axes and circles using new domains.
          self.reScale();

          // Animate lines.
          self.centerMainLine(d);

          // Unhighlight legend and axis labels.
          self.legend.selectAll(".legendLabel").classed("activeText", false);
          svg.selectAll(".axisLabel").classed("activeText", false);

          // Display reset button.
          self.setBtnDisplay(resetBtn, true);
      });

  // Add listeners to legend.
  svg.selectAll(".legendItems")
      .on("mouseover", function(p) {
          // Highlight legend.
          d3.select(this).select(".legendCircle").attr("r", config.radius.large);
          d3.select(this).select(".legendLabel").classed("activeText", true);

          // Animate circles for matching portfolio and add labels.
          svg.selectAll(".g-circle")
            .filter(function(d) { return d.category === p; })
            .each(function(d) {
              d3.select(this).select(".circle").attr("r", config.radius.large);
              self.addLabel(d3.select(this));
            });

          // Highlight axis labels.
          svg.selectAll(".axisLabel").classed("activeText", true);

          // Add line.
          self.drawLine(p);
      })
      .on("mouseout", function() {
          // Unhighlight legend.
          d3.select(this).select(".legendCircle").attr("r", config.radius.normal);
          d3.select(this).select(".legendLabel").classed("activeText", false);

          // Unanimate circles.
          svg.selectAll(".circle").attr("r", config.radius.normal);

          // Unhighlight axis labels.
          svg.selectAll(".axisLabel").classed("activeText", false);

          // Remove labels and lines.
          self.removeSelection(".dataLabels");
          self.removeLines();
      })
      .on("click", function(d) {
          // Update line class in order to retain.
          self.setMainLine();

          // Remove labels.
          self.removeSelection(".dataLabels");

          // Recompute x axis domains, centering on data value of clicked circle.
          self.recenterDomains(d);

          // Re-draw and animate x axes and circles using new domains.
          self.reScale();

          // Animate lines.
          self.centerMainLine(d);

          // Unhighlight axis labels.
          svg.selectAll(".axisLabel").classed("activeText", false);

          // Display reset button.
          self.setBtnDisplay(resetBtn, true);
      });

  // Reset chart to original scale on button click.
  resetBtn.on("click", function() {
      // Hide reset button.
      self.setBtnDisplay(resetBtn, false);

      // Remove lines and labels.
      self.removeLines();
      svg.select(".line.main").remove();
      self.removeSelection(".dataLabels");

      // Reset x axis domain to original extent.
      self.dimensions.map(function(p) {
        self.floorXpx[p] = 0;
        self.x[p].range([self.floorXpx[p], config.width]).domain(self.origExtent[p]);
      });

      // Re-draw and animate x axes and circles using new domains.
      self.reScale();
    });

  // Resize chart on window resize
  // https://github.com/mbostock/d3/wiki/Selections#on
  // To register multiple listeners for the same event type, the type may be followed by an optional namespace...
  d3.select(window).on("resize" + "." + self.config.chartParent, function() { self.reSize(); });
}

// Resizes chart.
RulerChart.prototype.reSize = function() {
  var self = this;

  // Recompute width and height from chart width and height.
  this.setWidthHeight();

  // Update svg width and height.
  this.config.chart.select(".chart-container")
          .attr("width", self.config.outerWidth)
          .attr("height", self.config.outerHeight);

  // Update chart title placement.
  this.svg.select(".chartTitle")
      .attr("transform","translate( " + (self.config.padding.left + self.config.width + self.config.padding.right) / 2 + ", " + (self.config.padding.top / 2) + ")");

  // Update x and y ranges.
  self.y.rangePoints([0, self.config.height], self.config.ordinalPadding);
  self.dimensions.map(function(p) { self.x[p].range([self.floorXpx[p], self.config.width]); });

  // Update number of ticks displayed.
  self.axis.ticks(self.tickCount(self.config.width));

  // Update dimension related elements
  this.g.each(function(p) {
    // Update y spacing.
    d3.select(this)
      .attr("transform", function(p) { return "translate( " + self.config.padding.left + ", " + (self.config.padding.top + self.y(p)) + ")" });

    // Update x axes.
    d3.select(this).selectAll(".axis")
      .each(function(p) { d3.select(this).call(self.axis.scale(self.x[p])); });

    // Update x values for circles.
    d3.select(this).selectAll(".g-circle")
      .attr("transform", function(d) { return "translate(" + self.x[p](d.value) + "," + 0 + ")"; });
  });

  // Update legend location.
  this.svg.select(".legend")
          .attr("transform","translate (" + (self.config.padding.left + self.config.width - self.config.radius.large) + ", " + (self.config.padding.top + self.config.height + self.config.radius.large) + ")");

  // Remove centered line (can't figure out rescaling)
  this.svg.select(".line.main").remove();
}

// Draws path across dimensions.
RulerChart.prototype.drawLine = function(d) {
  var category = (d.category) ? d.category : d;
  var self = this;

  self.svg.append("path")
    .attr("class", "line")
    .attr("transform", "translate( " + self.config.padding.left + ", " + self.config.padding.top +")")
    .attr("d", self.path(category))
    .style("pointer-events", "none")
    .style("stroke", self.config.color(category));
}

// Returns the path for a given data point.
RulerChart.prototype.path = function(d) {
    var self = this;
    return self.line(self.dimensions.map(function(p) {
                      return [self.x[p](self.categoryData[d][p]), self.y(p)];
                    }));
}

// Sets main line class.
RulerChart.prototype.setMainLine = function() {
  this.svg.select(".line.main").remove();
  this.svg.select(".line").attr("class", "line main");
}

// Removes all lines except the main line.
RulerChart.prototype.removeLines = function() {
    this.svg.selectAll(".line")
      .filter(function() { return d3.select(this).attr("class") != "line main"; })
      .remove();
}

// Recomputes domains, centering on passed data.
RulerChart.prototype.recenterDomains = function(d) {
  var category = (d.category) ? d.category : d;
  var minMax, centerVal, distFromCenter, maxDistFromCenter;
  var self = this;
  this.dimensions.map(function(p) {
      self.floorXpx[p] = 0;
      self.x[p].range([self.floorXpx[p], self.config.width]).domain(self.origExtent[p]);
      minMax = self.x[p].domain();

      centerVal = self.categoryData[category][p];
      distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
      maxDistFromCenter = d3.max(distFromCenter);
      self.x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

      if((centerVal - maxDistFromCenter) < self.floor[p]) {
        self.floorXpx[p] = self.x[p](self.floor[p]);
        self.x[p].range([self.floorXpx[p], self.config.width]).domain([self.floor[p], centerVal + maxDistFromCenter]);
      }
  });
}

// Redraws axes and circles.
RulerChart.prototype.reScale = function() {
  var self = this;
  self.g.each(function(p) {
    d3.select(this).selectAll(".axis")
      .transition()
        .duration(self.config.transition.durationShort)
      .call(self.axis.scale(self.x[p]));

    d3.select(this).selectAll(".g-circle")
    .style("pointer-events", "none")
      .transition()
        .duration(self.config.transition.durationShort)
      .attr("transform", function(d) { return "translate(" + self.x[p](d.value) + "," + 0 + ")"; })
      .each("end", function() { d3.select(this).style("pointer-events", null); });
  });
}

// Centers the main line.
RulerChart.prototype.centerMainLine = function(d) {
  var category = (d.category) ? d.category : d;
  var self = this;
  this.svg.select(".line.main")
    .transition()
      .duration(self.config.transition.durationShort)
    .attr("d", self.path(category));
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
ScatterPlot.prototype.draw = function() {}