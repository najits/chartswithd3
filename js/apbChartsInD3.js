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
function BaseChart() {};

// Public setters for chart parameters and config
BaseChart.prototype.setConfig = function() {
  var chartParent = this.args.chartParent,
      chartData = this.args.chartData,
      chart = d3.select(chartParent);

  // Spacing parameters
  var outerWidth = parseInt(chart.style("width")),
      outerHeight = parseInt(chart.style("height")),
      margin = {top: 20, right: 10, bottom: 20, left: 10},
      padding = {left: 120, right: 270},
      width = outerWidth - margin.left - margin.right - padding.left - padding.right,
      height = outerHeight - margin.top - margin.bottom;

  // Visual element and transition parameters
  var radius = {normal: 7, large: 10},
      transition = {duration: 1250, durationShort: 750, delay: 100};

  // Color parameters
  var color = d3.scale.ordinal()
              .range(["#55BE65", "#269DD6", "#7E408A", "#D35158", "#F09C26"]);

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
    color: color
  };
};

// Public getters for chart parameters and config
BaseChart.prototype.getConfig = function() {
  return this.config;
}

// Destroys chart
BaseChart.prototype.clearChart = function() {
  this.config.chart.selectAll("*").remove();
}

// Creates SVG chart-container
BaseChart.prototype.addChartContainer = function() {
  this.clearChart(); // Destroy chart first

  this.svg = this.config.chart.append("svg")
                .attr("class", "chart-container")
                .attr("width", this.config.outerWidth)
                .attr("height", this.config.outerHeight)
              .append("g")
                .attr("transform", "translate(" + this.config.margin.left + "," + this.config.margin.top + ")");

  return this.svg;
}

// Returns number of axis ticks based on chart width.
BaseChart.prototype.tickCount = function() {
  return this.config.width > 500 ? 6 : 2;
}

// Adds reset button to chart div
BaseChart.prototype.addResetBtn = function() {
    this.resetBtn = this.config.chart.append("input")
                      .attr("type","button")
                      .attr("value", "Reset")
                      .attr("class", "reset-btn btn btn-default btn-sm");

    return this.resetBtn;
}

// Set reset button display style
BaseChart.prototype.setBtnDisplay = function(btn, v) {
    if(v) {
      btn.style("display", null);
    } else {
      btn.style("display", "none");
    }
}

// Removes labels
BaseChart.prototype.removeLabels = function() {
  this.config.chart.selectAll(".labels").remove();
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
  var svg = this.addChartContainer();

  // Add reset button and hide
  var resetBtn = this.addResetBtn();
  this.setBtnDisplay(resetBtn, false);

  // Line and axis functions
  var line = d3.svg.line(),
      axis = d3.svg.axis().ticks(this.tickCount());

  // Y-axis ordinal scale and X-axis array
  var y = d3.scale.ordinal().rangePoints([0, config.height], 1),
      x = {};

  // RulerChart custom variables
  var origExtent = {}, floor = {}, floorXpx = {}, dimensions = {};

  var self = this;

  // Create chart from data
  d3.csv(config.chartData, function(error, csv) {

    // Extract the list of dimensions.
    y.domain(dimensions = d3.keys(csv[0]).filter(function(p) {
      return p != "Portfolio";
    }));

    // Extract the row specifying floors.
    floorRow = csv.filter(function(d) { return d.Portfolio === "__FLOOR"; });

    // Create a scale and record floor value for each dimension.
    dimensions.map(function(p) {
      floor[p] = floorRow.map(function(d) { return +d[p]; })[0];
      floorXpx[p] = 0;

      origExtent[p] = d3.extent(csv, function(d) { return +d[p]; });
      x[p] = d3.scale.linear().domain(origExtent[p]).range([floorXpx[p], config.width]);
    });

    // Filter out special rows before joining data to the chart.
    data = csv.filter(function(d) {
      return d.Portfolio != "__MIN" && d.Portfolio != "__MAX" && d.Portfolio != "__FLOOR";
    });

    // Create color palette.
    config.color.domain(data.map(F('Portfolio')));

    // Add a group element for each dimension.
    g = svg.selectAll(".dimension")
          .data(dimensions)
        .enter().append("g")
          .attr("class", "dimension")
          .attr("transform", function(p) {
            return "translate( " + config.padding.left + ", " + y(p) + ")";
          });

    // Add an axis.
    g.append("g")
      .attr("class", "axis")
      .each(function(p) {
        d3.select(this)
          .transition()
            .duration(config.transition.duration)
          .call(axis.scale(x[p]));
      });

    // Add a title.
    g.append("text")
      .attr("class", "axisLabel")
      .attr("x", -10)
      .attr("y", 5)
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
        .style({"stroke": "#EBEBEB",
                "fill-opacity": 0.1,
                "pointer-events": "none"})
          .transition()
            .delay(function(d, i) { return i * config.transition.delay; })
            .duration(config.transition.duration)
          .attr("cx", function(d) { return x[p](d[p]); })
          .style({"stroke": function(d) { return config.color(d.Portfolio); },
                  "fill-opacity": 0.7})
          .each("end", function() { d3.select(this).style("pointer-events", null); });
    });

    // Add legend.
    legend = svg.append("g")
              .attr("class","legend")
              .attr("transform","translate ( " + (config.width + config.padding.left + 50) + ", " + (config.height / 2 - 40) + ")");

    legend.selectAll(".legendItems")
        .data(data)
      .enter().append("g")
        .attr("class", "legendItems");

    legend.selectAll(".legendItems")
      .append("circle")
        .attr("class","legendCircle")
        .attr("r", config.radius.normal)
        .attr("cy", function(d, i) { return 22 * i; })
        .style("fill", function(d) { return config.color(d.Portfolio); })
        //animated items
        .style({"stroke": "#EBEBEB",
                "fill-opacity": 0.1,
                "pointer-events": "none"})
          .transition()
            .delay(function(d, i) { return i * config.transition.delay; })
            .duration(config.transition.duration)
          .style({"stroke": function(d) { return config.color(d.Portfolio); },
                  "fill-opacity": 0.7})
          .each("end", function() { d3.select(this).style("pointer-events", null); });

    legend.selectAll(".legendItems")
      .append("text")
        .attr("class","legendLabel")
        .text(F('Portfolio'))
        .attr("y", function(d, i) { return 22 * i; })
        .attr("x", 12)
        .attr("dy", "0.35em")
        .style({"pointer-events": "none",
                "fill-opacity": 0.1})
          .transition()
            .delay(function(d, i) { return i * config.transition.delay; })
            .duration(config.transition.duration)
          .style("fill-opacity", 1.0)
          .each("end", function() { d3.select(this).style("pointer-events", null); });

    // Add listeners to circles.
    svg.selectAll(".circle")
      .on("mouseover", function(d) {
          // Animate circle radius and add data label.
          d3.select(this)
            .attr("r", config.radius.large)
            .call(addLabel);

          // Highlight legend.
          config.chart.selectAll(".legendItems")
            .filter(function(p) { return p.Portfolio === d.Portfolio; })
              .each(function(p) {
                d3.select(this).select("circle").attr("r", config.radius.large);
                d3.select(this).select("text").style("font-weight", "bold");
              });

          // Add line.
          drawLine(d);
        })
      .on("mouseout", function() {
          // Unanimate circle radius.
          d3.select(this)
            .attr("r", config.radius.normal);

          // Remove labels
          self.removeLabels();

          // Unhighlight legend.
          legend.selectAll("circle").attr("r", config.radius.normal);
          legend.selectAll("text").style("font-weight", "normal");

          // Remove lines.
          removeLines();
        })
      .on("click", function(d) {
          // Update line class in order to retain.
          setCenterLine();

          // Remove labels
          self.removeLabels();

          // Recompute x axis domains, centering on data value of clicked circle.
          recenterDomains(d);

          // Transition clicked circle instantenously to void conflicts with listeners.
          d3.select(this.parentNode).each(function(p) { pValue = p; });
          d3.select(this).attr("cx", function(d) { return x[pValue](d[pValue]); });

          // Re-draw and animate x axes and circles using new domains.
          reScale();

          // Animate lines.
          centerLine(d);

          // Display reset button.
          self.setBtnDisplay(resetBtn, true);
      });

    // Add listeners to legend.
    svg.selectAll(".legendItems")
      .on("mouseover", function(p) {
          // Highlight legend.
          d3.select(this).select("circle").attr("r", config.radius.large);
          d3.select(this).select("text").style("font-weight", "bold");

          // Animate circles for matching portfolio and add labels.
          config.chart.selectAll(".circle")
            .filter(function(d) { return d.Portfolio === p.Portfolio; })
              .attr("r", config.radius.large)
              .call(addLabel);

          // Add line.
          drawLine(p);
      })
      .on("mouseout", function() {
          // Unhighlight legend.
          d3.select(this).select("circle").attr("r", config.radius.normal);
          d3.select(this).select("text").style("font-weight", "normal");

          // Unanimate circles.
          config.chart.selectAll(".circle").attr("r", config.radius.normal);

          // Remove labels and lines.
          self.removeLabels();
          removeLines();
      })
      .on("click", function(d) {
          // Update line class in order to retain.
          setCenterLine();

          // Remove labels.
          self.removeLabels();

          // Recompute x axis domains, centering on data value of clicked circle.
          recenterDomains(d);

          // Re-draw and animate x axes and circles using new domains.
          reScale();

          // Animate lines.
          centerLine(d);

          // Display reset button.
          self.setBtnDisplay(resetBtn, true);
      });

    // Reset chart to original scale on button click.
    resetBtn
      .on("click", function() {
          // Hide reset button.
          self.setBtnDisplay(resetBtn, false);

          // Remove lines and labels.
          removeLines();
          config.chart.select(".line.centered").remove();
          self.removeLabels();

          // Reset x axis domain to original extent.
          dimensions.map(function(p) {
            floorXpx[p] = 0;
            x[p].domain(origExtent[p]).range([floorXpx[p], config.width]);
          });

          // Re-draw and animate x axes and circles using new domains.
          reScale();
      });

    // Resize chart on window resize.
    // d3.select(window)
    //   .on("resize", reSize);
  });

  // Recomputes domains, centering on passed data.
  function recenterDomains(d) {
    dimensions.map(function(p) {
        floorXpx[p] = 0;
        x[p].domain(origExtent[p]).range([floorXpx[p], config.width]);
        minMax = x[p].domain();

        centerVal = +d[p];
        distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
        maxDistFromCenter = d3.max(distFromCenter);
        x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

        if((centerVal - maxDistFromCenter) < floor[p]) {
          floorXpx[p] = x[p](floor[p]);
          x[p].domain([floor[p], centerVal + maxDistFromCenter])
              .range([floorXpx[p], config.width]);
        }
    });
  }

  // Redraws axes and circles.
  function reScale() {
    config.chart.selectAll(".dimension").each(function(p) {
      d3.select(this).selectAll(".axis")
        .transition()
          .duration(config.transition.durationShort)
        .call(axis.scale(x[p]));

      d3.select(this).selectAll(".circle")
        .style("pointer-events", "none")
          .transition()
            .duration(config.transition.durationShort)
          .attr("cx", function(d) { return x[p](d[p]); })
          .each("end", function() {
            d3.select(this).style("pointer-events", null);
          });
    });
  }

  // Centers line.
  function centerLine(d) {
    config.chart.select(".line.centered").select("path")
      .transition()
        .duration(config.transition.durationShort)
      .attr("d", path(d));
  }

  // Sets center line class.
  function setCenterLine() {
    config.chart.select(".line.centered").remove();
    config.chart.select(".line").attr("class", "line centered");
  }

  // Adds data series labels.
  function addLabel(circle) {
    circle.each(function(d) {
        d3.select(this.parentNode).each(function(p) { pValue = p; });
        xTransform = parseFloat(d3.select(this).attr("cx")) + 5;

        labels = d3.select(this.parentNode)
                  .append("g")
                  .attr("class", "labels")
                  .attr("transform", "translate( " + xTransform + ", 0)")
                  .style("text-anchor", "end");

        labels.append("text")
            .text(d.Portfolio)
            .attr("y", -30);

        labels.append("text")
            .text(pValue + ": " + d[pValue])
            .attr("y", -15);
    });
  }

  // Resizes chart.
  function reSize() {
    // Recompute width and height from chart width and height.
    var outerWidth = parseInt(chart.style("width")),
        outerHeight = parseInt(chart.style("height")),
        width = outerWidth - margin.left - margin.right - padding.left - padding.right,
        height = outerHeight - margin.top - margin.bottom;

    // Update svg width and height.
    chart.select(".container")
          .attr("width", outerWidth)
          .attr("height", outerHeight);

    // Update x and y ranges.
    y.rangePoints([0, height], 1);
    dimensions.map(function(p) { x[p].range([floorXpx[p], width]); });

    // Update y spacing for dimensions.
    chart.selectAll(".dimension")
      .attr("transform", function(p) {
        return "translate( " + padding.left + ", " + y(p) + ")";
      });

    // Update number of ticks displayed.
    axis.ticks(tickCount(width));

    // Update x axes for dimensions.
    chart.selectAll(".axis")
      .each(function(p) { d3.select(this).call(axis.scale(x[p])); });

    // Update x values for circles.
    chart.selectAll(".dimension").each(function(p) {
      d3.select(this).selectAll(".circle")
        .attr("cx", function(d) { return x[p](d[p]); });
    });

    // Remove centered line (unable to figure out rescaling)
    chart.select(".line.centered").remove();

    // Update legend location.
    chart.select(".legend")
      .attr("display", null)
      .attr("transform", "translate ( " + (width + padding.left + 50) + ", " + (height / 2 - 40) + ")");
  }

  // Removes lines.
  function removeLines() {
    config.chart.selectAll(".line")
      .filter(function() { return d3.select(this).attr("class") != "line centered"; })
      .remove();
  }

  // Draws path across dimensions.
  function drawLine(d) {
    svg.append("g")
      .attr("class", "line")
    .append("path")
      .attr("transform", function(p) { return "translate( " + config.padding.left + ", 0)"; })
      .attr("d", path(d))
      .style("stroke", config.color(d.Portfolio));
  }

  // Returns the path for a given data point.
  function path(d) {
    return line(dimensions.map(function(p) { return [x[p](d[p]), y(p)]; }));
  }
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