// Add listeners to circles.
svg.selectAll(".circle")
  .on("mouseover", function(d) {
    })
  .on("mouseout", function() {
    })
  .on("click", function(d) {
  });

// Add listeners to legend.
svg.selectAll(".legendItems")
  .on("mouseover", function(p) {
  })
  .on("mouseout", function() {
  })
  .on("click", function(d) {
  });

// Resize chart on window resize.
d3.select(window)
  .on("resize", reSize);
});


// Add a group element for each x-axis
  var xAxes = svg.selectAll(".dimension")
                  .data(d3.keys(self.dimensions.x))
                  .enter().append("g")
                    .attr("class", "dimension")
                    .attr("transform", function(p) {
                      return "translate( " + config.padding.left + ", " + (config.padding.top + self.y(p)) + ")";
                    });

  // Add x-axes
  xAxes.append("g")
        .attr("class", "axis")
        .each(function(p) {
          d3.select(this)
            .transition()
              .duration(config.transition.duration)
            .call(self.axis.scale(self.x[p]));
        });

  // Add x-axis titles
  xAxes.append("text")
        .attr("class", "axisLabel")
        .attr("x", -1 * config.radius.large)
        .text(function(p) { return self.dimensions.x[p].parameters.displayName; });










