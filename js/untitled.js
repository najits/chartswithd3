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