function drawChart() {

  var margin = {top: 0, right: 200, bottom: 10, left: 100},
      width = 1000 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

  var x = {},
      y = d3.scale.ordinal().rangePoints([0, height], 1);

  var line = d3.svg.line(),
      axis = d3.svg.axis().ticks(5);

  var radiusNormal = 8,
      radiusLarge = 12;

  var pValue, centerVal,
      minMax = [], distFromCenter = [], maxDistFromCenter;

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.csv("data.csv", function(error, csv) {

    // Extract the list of dimensions and create a scale for each.
    y.domain(dimensions = d3.keys(csv[0]).filter(function(p) {
      return p != "Portfolio" && (x[p] = d3.scale.linear()
          .domain(d3.extent(csv, function(d) { return +d[p]; }))
          .range([0, width]));
    }));

    // Ignore __MIN and __MAX rows in data
    data = csv.filter(function(d) {
      return d.Portfolio != "__MIN" && d.Portfolio != "__MAX";
    });

    // Create portfolio color palette.
    var color = (data.length > 2) ? d3.scale.ordinal()
        .domain(data.map(function(d) { return d.Portfolio; }))
        .range(colorbrewer.YlGnBu[data.length]) : d3.scale.category10();

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
      .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(p) { return "translate( 0, " + y(p) + ")"; });

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(p) {
            d3.select(this)
              .transition().duration(1750)
                .call(axis.scale(x[p])); })
      .append("text")
        .style("text-anchor", "middle")
        .attr("x", -55)
        .attr("y", 5)
        .text(function(p) { return p; });

    // Add data markers on every dimension.
    g.each(function(p) {
        d3.select(this).selectAll(".circles")
          .data(data)
        .enter().append("circle")
          .attr("class", "circles")
          .attr("r", radiusNormal)
          .style("fill", function(d) { return color(d.Portfolio); })
          .attr("cx", function(d, i) { return (i * -5) - 10; })
          .style("stroke-width", 0.3)
          .style("fill-opacity", 0.1)
          .style("stroke", function(d) { return color(d.Portfolio); })
          .style("pointer-events", "none")
            .transition()
              .delay(function(d, i) { return i * 300; })
              .duration(1750)
            .attr("cx", function(d) { return x[p](d[p]); })
            .style("stroke-width", 0.5)
            .style("fill-opacity", 0.80)
            .style("stroke", "#636363")
            .each("end", function() {
              d3.select(this)
                .style("pointer-events", null);
            });
        });

    d3.selectAll(".circles")
      // Generate path and label on mouseover.
      .on("mouseover", function(d) {
          d3.select(this)
            .attr("r", radiusLarge);
          d3.select(this.parentNode)
            .append("text")
              .attr("class", "label")
              .text(d.Portfolio)
              .attr("x", parseFloat(d3.select(this).attr("cx")) + 5)
              .attr("y", -13);
          drawLine(d, color);
        })
      // Remove path and label on mouseout.
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
      // Re-scale axes on click.
      .on("click", function(d) {
          d3.select(this)
            .transition()
              .attr("r", radiusNormal)
              .each("end", function() {
                d3.select(this)
                  .style("pointer-events", null);
              });
          removeLinesLabels();

          dimensions.map(function(p) {
              centerVal = +d[p];
              x[p].domain(d3.extent(csv, function(d) { return +d[p]; }));
              minMax = x[p].domain();
              distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
              maxDistFromCenter = d3.max(distFromCenter);
              x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);
          });

          // To avoid listener conflict with transition below
          d3.select(this.parentNode)
            .each(function(p) { pValue = p; });
          d3.select(this)
            .attr("cx", function(d) { return x[pValue](d[pValue]); });

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
      });
  });

  // Removes lines and labels
  function removeLinesLabels () {
    d3.selectAll(".line").remove();
    d3.selectAll(".label").remove();
  }

  // Draws path across dimensions.
  function drawLine(d, color) {
    svg.append("g")
      .attr("class", "line")
    .append("path")
      .attr("d", path(d))
      .style("stroke", color(d.Portfolio));
  }

  // Returns the path for a given data point.
  function path(d) {
    return line(dimensions.map(function(p) { return [x[p](d[p]), y(p)]; }));
  }

}