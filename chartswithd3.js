var chart = d3.select("#chart");

var outerWidth = parseInt(chart.style("width")),
    outerHeight = parseInt(chart.style("height")),
    margin = {top: 20, right: 10, bottom: 20, left: 10},
    padding = {left: 100, right: 100},
    width = outerWidth - margin.left - margin.right - padding.left - padding.right,
    height = outerHeight - margin.top - margin.bottom;

var x = {},
    y = d3.scale.ordinal().rangePoints([0, height], 1);

var line = d3.svg.line(),
    axis = d3.svg.axis().ticks(width > 600 ? 6 : 3);

var radiusNormal = 8,
    radiusLarge = 12;

var pValue, centerVal,
    minMax = [], distFromCenter = [], maxDistFromCenter;

var svg = chart.append("svg")
            .attr("class", "container")
            .attr("width", outerWidth)
            .attr("height", outerHeight)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("data.csv", function(error, csv) {

  // Extract the list of dimensions and create a scale for each.
  y.domain(dimensions = d3.keys(csv[0]).filter(function(p) {
    return p != "Portfolio" && (x[p] = d3.scale.linear()
        .domain(d3.extent(csv, function(d) { return +d[p]; }))
        .range([0, width]));
  }));

  // Ignore __MIN and __MAX rows in data.
  data = csv.filter(function(d) {
    return d.Portfolio != "__MIN" && d.Portfolio != "__MAX";
  });

  // Create portfolio color palette.
  var color = (data.length > 2) ?
                d3.scale.ordinal()
                  .domain(data.map(function(d) { return d.Portfolio; }))
                  .range(colorbrewer.YlGnBu[data.length])
                : d3.scale.category10();

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
            .data(dimensions)
          .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(p) { return "translate( " + padding.left + ", " + y(p) + ")"; });

  // Add an axis and title.
  g.append("g")
    .attr("class", "axis")
    .each(function(p) {
        d3.select(this)
          .transition().duration(1750)
            .call(axis.scale(x[p])); })
    .append("text")
      .style("text-anchor", "end")
      .attr("x", -5)
      .attr("y", 5)
      .text(function(p) { return p; });

  // Add reset button.
  chart.append("input")
    .attr("type","button")
    .attr("value", "Reset")
    .attr("class", "reset");

  // Add and animate circles on each dimension.
  g.each(function(p) {
    d3.select(this).selectAll(".circles")
      .data(data)
    .enter().append("circle")
      .attr("class", "circles")
      .attr("r", radiusNormal)
      .style("fill", function(d) { return color(d.Portfolio); })
      .style("stroke-width", 0.5)
      //animated items
      .attr("cx", function(d, i) { return (i * -5) - 10; })
      .style("fill-opacity", 0.1)
      .style("stroke", function(d) { return color(d.Portfolio); })
      .style("pointer-events", "none")
        .transition()
          .delay(function(d, i) { return i * 300; })
          .duration(1750)
        .attr("cx", function(d) { return x[p](d[p]); })
        .style("fill-opacity", 0.70)
        .style("stroke", "#636363")
        .each("end", function() {
          d3.select(this)
            .style("pointer-events", null);
        });
  });

  // Add listeners to circles
  svg.selectAll(".circles")
    // Generate path and label on mouseover and circle radius enlarge effect.
    .on("mouseover", function(d) {
        d3.select(this)
          .attr("r", radiusLarge);
        d3.select(this.parentNode)
          .append("text")
            .attr("class", "label")
            .text(d.Portfolio)
            .attr("x", parseFloat(d3.select(this).attr("cx")) - 5 )
            .attr("y", -15);
        drawLine(d, color);
      })
    // Remove path and label on mouseout and change circle radius back to normal.
    .on("mouseout", function() {
        d3.select(this)
          .transition()
            .attr("r", radiusNormal)
            .each("end", function() {
              d3.select(this)
                .style("pointer-events", null);
            });
        removeLinesLabels();
      })
    // Re-scale axes on click, centering all axes on data value of clicked item.
    .on("click", function(d) {
        // Same as mouseout.
        d3.select(this)
          .transition()
            .attr("r", radiusNormal)
            .each("end", function() {
              d3.select(this)
                .style("pointer-events", null);
            });
        removeLinesLabels();

        // Recompute x axis domains, centering on data value of clicked item.
        dimensions.map(function(p) {
            centerVal = +d[p];
            x[p].domain(d3.extent(csv, function(d) { return +d[p]; }));
            minMax = x[p].domain();
            distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
            maxDistFromCenter = d3.max(distFromCenter);
            x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);
        });

        // Transition clicked circle instantenously to void conflict between transition and listeners.
        d3.select(this.parentNode)
          .each(function(p) { pValue = p; });
        d3.select(this)
          .attr("cx", function(d) { return x[pValue](d[pValue]); });

        // Re-draw and animate x axes and circles using new domains.
        reScale(g);
    });

    // Reset chart to original scale on button click
    chart.select(".reset")
      .on("click", function() {
          // Reset x axis domain to original.
          dimensions.map(function(p) {
            x[p].domain(d3.extent(csv, function(d) { return +d[p]; }));
          });

          // Re-draw and animate x axes and circles using new domains.
          reScale(g);
      });

  // Resize chart on window resize.
  d3.select(window)
    .on('resize', reSize);
});

// Resizes chart.
function reSize() {
  // Recompute width and height from #chart width and height.
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
  dimensions.map(function(p) { x[p].range([0, width]); });

  // Update y spacing for axes.
  svg.selectAll(".dimension")
    .attr("transform", function(p) { return "translate( " + padding.left + ", " + y(p) + ")"; });

  // Update number of ticks displayed.
  axis.ticks(width > 600 ? 6 : 3);

  // Update x range for axes.
  svg.selectAll(".axis")
    .each(function(p) { d3.select(this).call(axis.scale(x[p])); });

  // Update x values for circles.
  svg.selectAll(".dimension").each(function(p) {
    d3.select(this).selectAll(".circles")
      .attr("cx", function(d) { return x[p](d[p]); });
  });
}

// Redraws axes and circles.
function reScale (g) {
  g.each(function(p) {

    d3.select(this).selectAll(".axis")
      .transition().duration(750)
        .call(axis.scale(x[p]));

    d3.select(this).selectAll(".circles")
      .transition()
        .duration(750)
        .each("start", function() {
          d3.select(this)
            .style("pointer-events", "none");
        })
        .attr("cx", function(d) { return x[p](d[p]); })
        .each("end", function() {
          d3.select(this)
            .style("pointer-events", null);
        });
  });
}

// Removes lines and labels.
function removeLinesLabels () {
  svg.selectAll(".line").remove();
  svg.selectAll(".label").remove();
}

// Draws path across dimensions.
function drawLine(d, color) {
  svg.append("g")
    .attr("class", "line")
  .append("path")
    .attr("transform", function(p) { return "translate( " + padding.left + ", 0)"; })
    .attr("d", path(d))
    .style("stroke", color(d.Portfolio));
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [x[p](d[p]), y(p)]; }));
}