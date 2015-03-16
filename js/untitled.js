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