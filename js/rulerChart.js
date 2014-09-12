var chart = d3.select("#chart");

var outerWidth = parseInt(chart.style("width")),
    outerHeight = parseInt(chart.style("height")),
    margin = {top: 20, right: 10, bottom: 20, left: 10},
    padding = {left: 120, right: 250},
    width = outerWidth - margin.left - margin.right - padding.left - padding.right,
    height = outerHeight - margin.top - margin.bottom;

var x = {}, origExtent = {}, floor = {}, floorXpx = {},
    y = d3.scale.ordinal().rangePoints([0, height], 1);

var line = d3.svg.line(),
    axis = d3.svg.axis().outerTickSize(0).ticks(tickNumber(width));

var radius = {normal: 8, large: 12},
    transition = {duration: 1750, durationShort: 750, delay: 300};

var svg = chart.append("svg")
            .attr("class", "container")
            .attr("width", outerWidth)
            .attr("height", outerHeight)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("data/data.csv", function(error, csv) {

  // Extract the list of dimensions.
  y.domain(dimensions = d3.keys(csv[0]).filter(function(p) {
    return p != "Portfolio";
  }));

  // Extract the row specifying floors.
  floorRow = csv.filter(function(d) {
    return d.Portfolio === "__FLOOR";
  });

  // Create a scale and record floor for each dimension.
  dimensions.map(function(p) {
    floor[p] = floorRow.map(function(d) { return +d[p]; })[0];
    floorXpx[p] = 0;

    origExtent[p] = d3.extent(csv, function(d) { return +d[p]; });
    // x[p] = (p === "Total Risk") ? d3.scale.pow().exponent(2) : d3.scale.linear();
    // x[p].domain(origExtent[p]).range([0, width]);
    x[p] = d3.scale.linear().domain(origExtent[p]).range([floorXpx[p], width]);
  });

  // Create data.
  data = csv.filter(function(d) {
    return d.Portfolio != "__MIN" && d.Portfolio != "__MAX" && d.Portfolio != "__FLOOR";
  });

  // Create color palette.
  color = d3.scale.ordinal()
            .domain(data.map(function(d) { return d.Portfolio; }))
            .range(["#55BE65", "#269DD6", "#7E408A", "#D35158", "#F09C26"]);

  // Add a group element for each dimension.
  g = svg.selectAll(".dimension")
        .data(dimensions)
      .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(p) {
          return "translate( " + padding.left + ", " + y(p) + ")";
        });

  // Add an axis.
  g.append("g")
    .attr("class", "axis")
    .each(function(p) {
      d3.select(this)
        .transition()
          .duration(transition.duration)
        .call(axis.scale(x[p]));
    });

  // Add a title.
  g.append("text")
    .attr("class", "axisLabel")
    .attr("x", -10)
    .attr("y", 5)
    .text(function(p) { return p; });

  // Add and animate circles on each dimension.
  g.each(function(p) {
    d3.select(this).selectAll(".circle")
      .data(data)
    .enter().append("circle")
      .attr("class", "circle")
      .attr("r", radius.normal)
      //animated items
      .attr("cx", 0)
      .style({"fill": "#EBEBEB",
             "fill-opacity": 0.3,
             "stroke": "#EBEBEB"})
      .style("pointer-events", "none")
        .transition()
          .delay(function(d, i) { return i * transition.delay; })
          .duration(transition.duration)
        .attr("cx", function(d) { return x[p](d[p]); })
        .style("fill", function(d) { return color(d.Portfolio); })
        .style("fill-opacity", 0.7)
        .style("stroke", function(d) { return color(d.Portfolio); })
        .each("end", function() {
          d3.select(this).style("pointer-events", null);
        });
  });

  // Add legend.
  legend = svg.append("g")
            .attr("class","legend")
            .attr("transform","translate ( " + (width + padding.left + 50) + ", " + (height / 2 - 40) + ")");

  legend.selectAll(".legendItems")
    .data(data).enter()
    .append("g")
      .attr("class", "legendItems");

  legend.selectAll(".legendItems")
    .append("circle")
      .attr("class","legendCircle")
      .attr("r", radius.normal)
      .attr("cy", function(d, i) { return 22 * i; })
      //animated items
      .style({"fill": "#EBEBEB",
             "fill-opacity": 0.3,
             "stroke": "#EBEBEB"})
      .style("pointer-events", "none")
        .transition()
          .delay(function(d, i) { return i * transition.delay; })
          .duration(transition.duration)
        .style("fill", function(d) { return color(d.Portfolio); })
        .style("fill-opacity", 0.7)
        .style("stroke", function(d) { return color(d.Portfolio); })
        .each("end", function() {
          d3.select(this).style("pointer-events", null);
        });

  legend.selectAll(".legendItems")
    .append("text")
      .attr("class","legendLabel")
      .text(function(d) { return d.Portfolio; })
      .attr("y", function(d, i) { return 22 * i; })
      .attr("x", 12)
      .attr("dy", "0.35em")
      .style({"pointer-events": "none",
              "fill-opacity": 0.0})
        .transition()
          .delay(function(d, i) { return i * transition.delay; })
          .duration(transition.duration)
        .style("fill-opacity", 1.0)
        .each("end", function() {
          d3.select(this).style("pointer-events", null);
        });

  // Add and hide reset button.
  chart.append("input")
    .attr("type","button")
    .attr("value", "Reset")
    .attr("class", "reset")
    .style("display", "none");

  // Add listeners to circles.
  svg.selectAll(".circle")
    .on("mouseover", function(d) {
        // Animate circle radius and add data label.
        d3.select(this)
          .attr("r", radius.large)
          .call(addLabel);

        // Highlight legend.
        legend.selectAll(".legendItems")
          .filter(function(p) { return p.Portfolio === d.Portfolio; })
            .each(function(p) {
              d3.select(this).select(".legendCircle").attr("r", radius.large);
              d3.select(this).select(".legendLabel").style("font-weight", "bold");
            });

        // Add line.
        drawLine(d, color);
      })
    .on("mouseout", function() {
        // Unanimate circle radius and remove label.
        d3.select(this)
          .attr("r", radius.normal)
          .call(removeLabels);

        // Unhighlight legend.
        legend.selectAll(".legendCircle").attr("r", radius.normal);
        legend.selectAll(".legendLabel").style("font-weight", "normal");

        // Remove lines.
        removeLines();
      })
    .on("click", function(d) {
        // Update line class in order to retain.
        setCenterLine();

        // Remove labels.
        removeLabels();

        // Recompute x axis domains, centering on data value of clicked circle.
        recenterDomains(d);

        // Transition clicked circle instantenously to void conflicts with listeners.
        d3.select(this.parentNode).each(function(p) { pValue = p; });
        d3.select(this).attr("cx", function(d) { return x[pValue](d[pValue]); });

        // Re-draw and animate x axes and circles using new domains.
        reScale(g);

        // Animate lines.
        centerLine(d);

        // Display reset button.
        d3.select(".reset").style("display", null);
    });

  // Add listeners to legend.
  svg.selectAll(".legendItems")
    .on("mouseover", function(p) {
        // Highlight legend.
        d3.select(this).select(".legendCircle").attr("r", radius.large);
        d3.select(this).select(".legendLabel").style("font-weight", "bold");

        // Animate circles for matching portfolio and add labels.
        svg.selectAll(".circle")
          .filter(function(d) { return d.Portfolio === p.Portfolio; })
            .attr("r", radius.large)
            .call(addLabel);

        // Add line.
        drawLine(p, color);
    })
    .on("mouseout", function() {
        // Unhighlight legend.
        d3.select(this).select(".legendCircle").attr("r", radius.normal);
        d3.select(this).select(".legendLabel").style("font-weight", "normal");

        // Unanimate circles.
        svg.selectAll(".circle").attr("r", radius.normal);

        // Remove labels and lines.
        removeLabels();
        removeLines();
    })
    .on("click", function(d) {
        // Update line class in order to retain.
        setCenterLine();

        // Remove labels.
        removeLabels();

        // Recompute x axis domains, centering on data value of clicked circle.
        recenterDomains(d);

        // Re-draw and animate x axes and circles using new domains.
        reScale(g);

        // Animate lines.
        centerLine(d);

        // Display reset button.
        d3.select(".reset").style("display", null);
    });

  // Reset chart to original scale on button click.
  chart.select(".reset")
    .on("click", function() {
        // Hide reset button.
        d3.select(".reset").style("display", "none");

        // Remove lines and labels.
        removeLines();
        d3.select(".line.centered").remove();
        removeLabels();

        // Reset x axis domain to original extent.
        dimensions.map(function(p) {
          floorXpx[p] = 0;
          x[p].domain(origExtent[p])
              .range([floorXpx[p], width]);
        });

        // Re-draw and animate x axes and circles using new domains.
        reScale(g);
    });

  // Resize chart on window resize.
  d3.select(window)
    .on("resize", reSize);
});

// Recomputes domains, centering on passed data.
function recenterDomains(d) {
  dimensions.map(function(p) {
      floorXpx[p] = 0;
      centerVal = +d[p];
      x[p].domain(origExtent[p])
          .range([floorXpx[p], width]);
      minMax = x[p].domain();
      distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
      maxDistFromCenter = d3.max(distFromCenter);
      x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

      if((centerVal - maxDistFromCenter) < floor[p]) {
        floorXpx[p] = x[p](floor[p]);
        x[p].domain([floor[p], centerVal + maxDistFromCenter])
            .range([floorXpx[p], width]);
      }
  });
}

// Redraws axes and circles.
function reScale(g) {
  g.each(function(p) {
    d3.select(this).selectAll(".axis")
      .transition()
        .duration(transition.durationShort)
      .call(axis.scale(x[p]));

    d3.select(this).selectAll(".circle")
      .style("pointer-events", "none")
        .transition()
          .duration(transition.durationShort)
        .attr("cx", function(d) { return x[p](d[p]); })
        .each("end", function() {
          d3.select(this).style("pointer-events", null);
        });
  });
}

// Centers line.
function centerLine(d) {
  d3.select(".line.centered").select("path")
    .transition()
      .duration(transition.durationShort)
    .attr("d", path(d));
}

// Sets center line class.
function setCenterLine() {
  d3.select(".line.centered").remove();
  d3.select(".line").attr("class", "line centered");
}

// Adds data series labels.
function addLabel(circle) {
  circle.each(function(d) {
      d3.select(this.parentNode).each(function(p) { pValue = p; });
      xTransform = parseFloat(d3.select(this).attr("cx")) - 5;

      labels = d3.select(this.parentNode)
                .append("g")
                .attr("class", "labels")
                .attr("transform", "translate( " + xTransform + ", 0)")
                .style("text-anchor", "start");

      labels.append("text")
          .attr("class", "nameLabel")
          .text(d.Portfolio)
          .attr("y", -30);

      labels.append("text")
          .attr("class", "valueLabel")
          .text(pValue + ": " + d[pValue])
          .attr("y", -15);
  });
}

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
  dimensions.map(function(p) { x[p].range([floorXpx[p], width]); });

  // Update y spacing for dimensions.
  svg.selectAll(".dimension")
    .attr("transform", function(p) {
      return "translate( " + padding.left + ", " + y(p) + ")";
    });

  // Update number of ticks displayed.
  axis.ticks(tickNumber(width));

  // Update x axes for dimensions.
  svg.selectAll(".axis")
    .each(function(p) { d3.select(this).call(axis.scale(x[p])); });

  // Update x values for circles.
  svg.selectAll(".dimension").each(function(p) {
    d3.select(this).selectAll(".circle")
      .attr("cx", function(d) { return x[p](d[p]); });
  });

  // Remove centered line (unable to figure out rescaling)
  d3.select(".line.centered").remove();

  // Update legend location.
  svg.select(".legend")
    .attr("display", null)
    .attr("transform", "translate ( " + (width + padding.left + 50) + ", " + (height / 2 - 40) + ")");
}

// Removes lines.
function removeLines() {
  svg.selectAll(".line")
    .filter(function() { return d3.select(this).attr("class") != "line centered"; })
    .remove();
}

// Removes labels.
function removeLabels() {
  svg.selectAll(".labels").remove();
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

// Returns number of axis ticks based on chart width.
function tickNumber(width) {
  return width > 500 ? 6 : 2;
}