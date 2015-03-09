/* Helper functions */

// Convenient Interitance
// http://phrogz.net/JS/classes/OOPinJS2.html
Function.prototype.inheritsFrom = function( parentClassOrObject ){
  if ( parentClassOrObject.constructor == Function ) {
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
};

// Obtains and sets width and height params from chart
BaseChart.prototype.setWidthHeight = function () {
  this.config.outerWidth = parseInt(this.config.chart.style("width"));
  this.config.outerHeight = parseInt(this.config.chart.style("height"));
  this.config.width = this.config.outerWidth - this.config.margin.left - this.config.margin.right - this.config.padding.left - this.config.padding.right;
  this.config.height = this.config.outerHeight - this.config.margin.top - this.config.margin.bottom;
}

// Public setters for chart parameters and config
BaseChart.prototype.setConfig = function() {
  var chartParent = this.args.chartParent,
      chartData = this.args.chartData,
      chart = d3.select(chartParent);

  // Spacing parameters
  var outerWidth, outerHeight, width, height,
      margin = {top: 20, right: 10, bottom: 20, left: 10},
      padding = {left: 120, right: 270};

  // Color parameters
  var color = d3.scale.ordinal()
              .range(["#55BE65", "#269DD6", "#7E408A", "#D35158", "#F09C26"]),
      baseColor = "#EBEBEB";

  // Visual element and transition parameters
  var radius = {normal: 7, large: 10},
      transition = {duration: 1250, durationShort: 500, delay: 100},
      opacity = {start: 0.1, end: 0.7};

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
    radius: radius,
    transition: transition,
    color: color,
    baseColor: baseColor,
    opacity: opacity
  };

  // Set width and height params
  this.setWidthHeight();
};

// Public getters for chart parameters and config
BaseChart.prototype.getConfig = function() { return this.config; }

// Creates SVG chart-container
BaseChart.prototype.addChartContainer = function() {
  this.removeSelection("__ALL__"); // Destroy chart first

  this.svg = this.config.chart.append("svg")
                .attr("class", "chart-container")
                .attr("width", this.config.outerWidth)
                .attr("height", this.config.outerHeight)
              .append("g")
                .attr("transform", "translate(" + this.config.margin.left + "," + this.config.margin.top + ")");

  return this.svg;
}

// Returns number of axis ticks based on chart width.
BaseChart.prototype.tickCount = function() { return this.config.width > 500 ? 6 : 2; }

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

  // RulerChart custom variables
  this.x = {}, this.y;
  this.origExtent = {}, this.floor = {}, this.floorXpx = {}, this.dimensions = {}, this.floorRow;
}

// Inherit from BaseChart
RulerChart.inheritsFrom(BaseChart);

// RulerChart's draw function
RulerChart.prototype.draw = function() {

  // Get chart config
  var config = this.getConfig();

  // Create SVG to house chart
  var svg = this.addChartContainer();

  // Add reset button and hide
  var resetBtn = this.addResetBtn();
  this.setBtnDisplay(resetBtn, false);

  // Set x-axis tick count
  this.axis.ticks(this.tickCount());

  // Create y-scale and set range
  this.y = d3.scale.ordinal().rangePoints([0, config.height], 1)

  // Local variables
  var legend, g, data, pValue;

  // Carry RulerChart 'this' context in 'self'
  var self = this;

  // Create chart from data
  d3.csv(config.chartData, function(error, csv) {

    // Extract the list of dimensions.
    self.y.domain(self.dimensions = d3.keys(csv[0]).filter(function(p) {
      return p != "Portfolio";
    }));

    // Extract the row specifying floors.
    self.floorRow = csv.filter(function(d) { return d.Portfolio === "__FLOOR"; });

    // Create a scale and record floor value for each dimension.
    self.dimensions.map(function(p) {
      self.floor[p] = self.floorRow.map(function(d) { return +d[p]; })[0];
      self.floorXpx[p] = 0;
      self.origExtent[p] = d3.extent(csv, function(d) { return +d[p]; });
      self.x[p] = d3.scale.linear()
                    .domain(self.origExtent[p])
                    .range([self.floorXpx[p], config.width]);
    });

    // Filter out special rows before joining data to the chart.
    data = csv.filter(function(d) {
      return d.Portfolio != "__MIN" && d.Portfolio != "__MAX" && d.Portfolio != "__FLOOR";
    });

    // Create color palette.
    config.color.domain(data.map(F('Portfolio')));

    // Add a group element for each dimension.
    g = svg.selectAll(".dimension")
            .data(self.dimensions)
          .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(p) {
              return "translate( " + config.padding.left + ", " + self.y(p) + ")";
            });

    // Add an axis.
    g.append("g")
      .attr("class", "axis")
      .each(function(p) {
        d3.select(this)
          .transition()
            .duration(config.transition.duration)
          .call(self.axis.scale(self.x[p]));
      });

    // Add a title.
    g.append("text")
      .attr("class", "axisLabel")
      .attr("x", -5)
      .text(I);

    // Add and animate circles on each dimension.
    g.each(function(p) {
      d3.select(this).selectAll(".circle")
        .data(data)
      .enter().append("circle")
        .attr("class", "circle")
        .attr("r", config.radius.normal)
        .style("fill", function(d) { return config.color(d.Portfolio); })
        //animated items
        .attr("cx", 0)
        .style({"stroke": config.baseColor,
                "fill-opacity": config.opacity.start,
                "pointer-events": "none"})
          .transition()
            .delay(function(d, i) { return i * config.transition.delay; })
            .duration(config.transition.duration)
          .attr("cx", function(d) { return self.x[p](d[p]); })
          .style({"stroke": function(d) { return config.color(d.Portfolio); },
                  "fill-opacity": config.opacity.end})
          .each("end", function() { d3.select(this).style("pointer-events", null); });
    });

    // Add legend.
    legend = svg.append("g")
              .attr("class", "legend")
              .attr("transform","translate ( " + (config.width + config.padding.left + 50) + ", " + (config.height / 2 - 40) + ")")
                .selectAll(".legendItems")
                  .data(data)
                .enter().append("g")
                  .attr("class", "legendItems");

    legend.append("circle")
          .attr("class","legendCircle")
          .attr("r", config.radius.normal)
          .attr("cy", function(d, i) { return 18 * i; })
          .style("fill", function(d) { return config.color(d.Portfolio); })
          //animated items
          .style({"stroke": config.baseColor,
                  "fill-opacity": config.opacity.start,
                  "pointer-events": "none"})
            .transition()
              .delay(function(d, i) { return i * config.transition.delay; })
              .duration(config.transition.duration)
            .style({"stroke": function(d) { return config.color(d.Portfolio); },
                    "fill-opacity": config.opacity.end})
            .each("end", function() { d3.select(this).style("pointer-events", null); });

    legend.append("text")
          .attr("class","legendLabel")
          .text(F('Portfolio'))
          .attr("y", function(d, i) { return 18 * i; })
          .attr("x", 15)
          .attr("dy", "0.35em")
          .style("pointer-events", "none")
            .transition()
              .delay(function(d, i) { return i * config.transition.delay; })
              .duration(config.transition.duration)
            .each("end", function() { d3.select(this).style("pointer-events", null); });

    // Add listeners to circles.
    svg.selectAll(".circle")
        .on("mouseover", function(d) {
            // Animate circle radius and add data label.
            d3.select(this).attr("r", config.radius.large).call(self.addLabel);

            // Highlight legend.
            legend.filter(function(p) { return p.Portfolio === d.Portfolio; })
              .each(function(p) {
                d3.select(this).select(".legendCircle").attr("r", config.radius.large);
                d3.select(this).select(".legendLabel").classed("activeText", true); });

            // Add line.
            self.drawLine(d);
          })
        .on("mouseout", function() {
            // Unanimate circle radius.
            d3.select(this).attr("r", config.radius.normal);

            // Remove labels
            self.removeSelection(".dataLabels");

            // Unhighlight legend and axis label
            legend.selectAll(".legendCircle").attr("r", config.radius.normal);
            legend.selectAll(".legendLabel").classed("activeText", false);

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

            // Transition clicked circle instantenously to void conflicts with listeners.
            d3.select(this.parentNode).each(function(p) { pValue = p; });
            d3.select(this).attr("cx", function(d) { return self.x[pValue](d[pValue]); });

            // Re-draw and animate x axes and circles using new domains.
            self.reScale(g);

            // Animate lines.
            self.centerMainLine(d);

            // Unhighlight legend and axis labels.
            legend.selectAll(".legendLabel").classed("activeText", false);
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
            svg.selectAll(".circle")
              .filter(function(d) { return d.Portfolio === p.Portfolio; })
                .attr("r", config.radius.large)
                .call(self.addLabel);

            // Add line.
            self.drawLine(p);
        })
        .on("mouseout", function() {
            // Unhighlight legend.
            d3.select(this).select("circle").attr("r", config.radius.normal);
            d3.select(this).select("text").classed("activeText", false);

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
            self.reScale(g);

            // Animate lines.
            self.centerMainLine(d);

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
          self.x[p]
            .domain(self.origExtent[p])
            .range([self.floorXpx[p], config.width]);
        });

        // Re-draw and animate x axes and circles using new domains.
        self.reScale(g);
      });

    // Resize chart on window resize.
    d3.select(window)
      .on("resize", function() { console.log("pre-resizing!"); self.reSize(); });
  });
}

// Resizes chart.
RulerChart.prototype.reSize = function() {
  console.log("post-resizing!");

  var self = this;

  // Recompute width and height from chart width and height.
  this.setWidthHeight();

  // Update svg width and height.
  this.svg.attr("width", self.config.outerWidth)
          .attr("height", self.config.outerHeight);

  // Update x and y ranges.
  self.y.rangePoints([0, self.config.height], 1);
  self.dimensions.map(function(p) { self.x[p].range([self.floorXpx[p], self.config.width]); });

  // Update y spacing for dimensions.
  this.svg.selectAll(".dimension")
    .attr("transform", function(p) {
      return "translate( " + self.config.padding.left + ", " + self.y(p) + ")";
    });

  // Update number of ticks displayed.
  self.axis.ticks(self.tickCount(self.config.width));

  // Update x axes for dimensions.
  this.svg.selectAll(".axis")
    .each(function(p) { d3.select(this).call(self.axis.scale(self.x[p])); });

  // Update x values for circles.
  this.svg.selectAll(".dimension").each(function(p) {
    d3.select(this).selectAll(".circle")
      .attr("cx", function(d) { return self.x[p](d[p]); });
  });

  // Remove centered line (unable to figure out rescaling)
  this.svg.select(".line.main").remove();

  // Update legend location.
  this.svg.select(".legend")
    // .attr("display", null)
    .attr("transform", "translate ( " + (self.config.width + self.config.padding.left + 50) + ", " + (self.config.height / 2 - 40) + ")");
}

// Adds data labels and highlights axis.
RulerChart.prototype.addLabel = function(elem) {
  var pValue, xTransform;
  elem.each(function(d) {
      d3.select(this.parentNode)
        .each(function(p) {
          pValue = p;
          d3.select(this).select(".axisLabel").classed("activeText", true);
        });

      xTransform = parseFloat(d3.select(this).attr("cx"));

      d3.select(this.parentNode)
        .append("g")
        .attr("transform", "translate( " + xTransform + ", 0)")
          .append("text")
          .attr("class", "dataLabels")
          .attr("y", -15)
          .text(d[pValue])
          .classed("activeText", true);

      // labels.append("text")
      //     .text(d.Portfolio)
      //     .attr("x", -30)
      //     .attr("y", +30)
      //     .style("text-anchor", "start");

      // labels.append("text")
      //     .text(pValue + ": " + d[pValue])
      //     .attr("y", -15);
  });
}

// Draws path across dimensions.
RulerChart.prototype.drawLine = function(d) {
  var self = this;
  this.svg.append("path")
    .attr("class", "line")
    .attr("transform", function(p) { return "translate( " + self.config.padding.left + ", 0)"; })
    .attr("d", self.path(d))
    .style("pointer-events", "none")
    .style("stroke", self.config.color(d.Portfolio));
}

// Returns the path for a given data point.
RulerChart.prototype.path = function(d) {
    var self = this;
    return self.line(self.dimensions.map(function(p) { return [self.x[p](d[p]), self.y(p)]; }));
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
  var minMax, centerVal, distFromCenter, maxDistFromCenter;
  var self = this;
  this.dimensions.map(function(p) {
      self.floorXpx[p] = 0;
      self.x[p].domain(self.origExtent[p]).range([self.floorXpx[p], self.config.width]);
      minMax = self.x[p].domain();

      centerVal = +d[p];
      distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
      maxDistFromCenter = d3.max(distFromCenter);
      self.x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

      if((centerVal - maxDistFromCenter) < self.floor[p]) {
        self.floorXpx[p] = self.x[p](self.floor[p]);
        self.x[p].domain([self.floor[p], centerVal + maxDistFromCenter])
            .range([self.floorXpx[p], self.config.width]);
      }
  });
}

// Redraws axes and circles.
RulerChart.prototype.reScale = function(g) {
  var self = this;
  g.each(function(p) {
    d3.select(this).selectAll(".axis")
      .transition()
        .duration(self.config.transition.durationShort)
      .call(self.axis.scale(self.x[p]));

    d3.select(this).selectAll(".circle")
      .style("pointer-events", "none")
        .transition()
          .duration(self.config.transition.durationShort)
        .attr("cx", function(d) { return self.x[p](d[p]); })
        .each("end", function() { d3.select(this).style("pointer-events", null);});
  });
}
// Centers the main line.
RulerChart.prototype.centerMainLine = function(d) {
  var self = this;
  this.svg.select(".line.main")
    .transition()
      .duration(self.config.transition.durationShort)
    .attr("d", self.path(d));
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
// RulerChart.prototype.draw = function() {
//   var x = d3.scale.linear().range([0,width]), domain = {},
//     y = d3.scale.linear().range([height, 0]);

//   var xAxis = d3.svg.axis()
//                 .outerTickSize(0).ticks(tickNumber(width))
//                 .scale(x)
//                 .orient("bottom");

//   var yAxis = d3.svg.axis()
//                 .outerTickSize(0).ticks(tickNumber(width))
//                 .scale(y)
//                 .orient("left");

//   var line = d3.svg.line();

//   d3.csv("data/data2nd.csv", function(error, csv) {

//     // Extract the list of dimensions.
//     dimensions = d3.keys(csv[0]).filter(function(p) {
//       return p != "Portfolio";
//     });

//     // Create a domain for each dimension.
//     dimensions.map(function(p) {
//       domain[p] = d3.extent(csv, function(d) { return +d[p]; });
//     });

//     x.domain(domain["Risk"]);
//     y.domain(domain["Return"]);

//     // Create data.
//     data = csv.filter(function(d) {
//       return d.Portfolio != "__MIN" && d.Portfolio != "__MAX";
//     });

//     // Create color palette.
//     color.domain(data.map(function(d) { return d.Portfolio; }));

//     // Add x axis.
//     svg.append("g")
//         .attr("class", "x axis")
//         .attr("transform", "translate( " + padding.left + ", " + height + ")")
//         .call(xAxis)
//       .append("text")
//         .attr("class", "label")
//         .attr("x", width)
//         .attr("y", -6)
//         .text("Risk");

//     // Add y axis.
//     svg.append("g")
//         .attr("class", "y axis")
//         .attr("transform", "translate( " + padding.left + ", 0)")
//         .call(yAxis)
//       .append("text")
//         .attr("class", "label")
//         .attr("transform", "rotate(-90)")
//         .attr("y", 6)
//         .attr("dy", ".71em")
//         .text("Return");

//     // Add and animate circles on each dimension.
//     svg.selectAll(".circle")
//         .data(data)
//       .enter().append("circle")
//         .attr("class", "circle")
//         .attr("r", radius.normal)
//         .attr("cx", function(d) { return x(d.Risk); })
//         //animated items
//         .attr("cy", height)
//         .style({"fill": "#EBEBEB",
//                "fill-opacity": 0.3,
//                "stroke": "#EBEBEB"})
//         .style("pointer-events", "none")
//           .transition()
//             .delay(function(d, i) { return i * transition.delay; })
//             .duration(transition.duration)
//           .attr("cy", function(d) { return y(d.Return); })
//           .style("fill", function(d) { return color(d.Portfolio); })
//           .style("fill-opacity", 0.7)
//           .style("stroke", function(d) { return color(d.Portfolio); })
//           .each("end", function() {
//             d3.select(this).style("pointer-events", null);
//           });

//     // Add legend.
//     legend = svg.append("g")
//               .attr("class","legend")
//               .attr("transform","translate ( " + (width + padding.left + 50) + ", " + (height / 2 - 40) + ")");

//     legend.selectAll(".legendItems")
//         .data(data)
//       .enter().append("g")
//         .attr("class", "legendItems");

//     legend.selectAll(".legendItems")
//       .append("circle")
//         .attr("class","legendCircle")
//         .attr("r", radius.normal)
//         .attr("cy", function(d, i) { return 22 * i; })
//         //animated items
//         .style({"fill": "#EBEBEB",
//                "fill-opacity": 0.3,
//                "stroke": "#EBEBEB"})
//         .style("pointer-events", "none")
//           .transition()
//             .delay(function(d, i) { return i * transition.delay; })
//             .duration(transition.duration)
//           .style("fill", function(d) { return color(d.Portfolio); })
//           .style("fill-opacity", 0.7)
//           .style("stroke", function(d) { return color(d.Portfolio); })
//           .each("end", function() {
//             d3.select(this).style("pointer-events", null);
//           });

//     legend.selectAll(".legendItems")
//       .append("text")
//         .attr("class","legendLabel")
//         .text(function(d) { return d.Portfolio; })
//         .attr("y", function(d, i) { return 22 * i; })
//         .attr("x", 12)
//         .attr("dy", "0.35em")
//         .style({"pointer-events": "none",
//                 "fill-opacity": 0.0})
//           .transition()
//             .delay(function(d, i) { return i * transition.delay; })
//             .duration(transition.duration)
//           .style("fill-opacity", 1.0)
//           .each("end", function() {
//             d3.select(this).style("pointer-events", null);
//           });

//     // Add listeners to circles.
//     svg.selectAll(".circle")
//       .on("mouseover", function(d) {
//         })
//       .on("mouseout", function() {
//         })
//       .on("click", function(d) {
//       });

//     // Add listeners to legend.
//     svg.selectAll(".legendItems")
//       .on("mouseover", function(p) {
//       })
//       .on("mouseout", function() {
//       })
//       .on("click", function(d) {
//       });

//     // Resize chart on window resize.
//     d3.select(window)
//       .on("resize", reSize);
//   });

//   // Resizes chart.
//   function reSize() {
//     // Recompute width and height from #chart width and height.
//     var outerWidth = parseInt(chart.style("width")),
//         outerHeight = parseInt(chart.style("height")),
//         width = outerWidth - margin.left - margin.right - padding.left - padding.right,
//         height = outerHeight - margin.top - margin.bottom;

//     // Update svg width and height.
//     chart.select(".container")
//           .attr("width", outerWidth)
//           .attr("height", outerHeight);

//     // Update x and y ranges.
//     y.rangePoints([0, height], 1);
//     dimensions.map(function(p) { x[p].range([floorXpx[p], width]); });

//     // Update y spacing for dimensions.
//     svg.selectAll(".dimension")
//       .attr("transform", function(p) {
//         return "translate( " + padding.left + ", " + y(p) + ")";
//       });

//     // Update number of ticks displayed.
//     axis.ticks(tickNumber(width));

//     // Update x axes for dimensions.
//     svg.selectAll(".axis")
//       .each(function(p) { d3.select(this).call(axis.scale(x[p])); });

//     // Update x values for circles.
//     svg.selectAll(".dimension").each(function(p) {
//       d3.select(this).selectAll(".circle")
//         .attr("cx", function(d) { return x[p](d[p]); });
//     });

//     // Remove centered line (unable to figure out rescaling)
//     d3.select(".line.centered").remove();

//     // Update legend location.
//     svg.select(".legend")
//       .attr("display", null)
//       .attr("transform", "translate ( " + (width + padding.left + 50) + ", " + (height / 2 - 40) + ")");
//   }

//   // Returns number of axis ticks based on chart width.
//   function tickNumber(width) {
//     return width > 500 ? 6 : 2;
//   }
// }