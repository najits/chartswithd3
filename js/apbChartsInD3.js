/* Helper functions */

// Convenient Interitance
// http://phrogz.net/JS/classes/OOPinJS2.html
Function.prototype.inheritsFrom = function (parentClassOrObject) {
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
};

// Fewer Lambdas in D3.js
// http://phrogz.net/fewer-lambdas-in-d3-js
function F(name) {
    var v, params = Array.prototype.slice.call(arguments, 1);
    return function (o) {
        return (typeof(v = o[name]) === "function" ? v.apply(o, params) : v);
    };
}
// Returns the first argument passed in
function I(d) {
    return d;
}


/* BaseChart */

// Define BaseChart class
function BaseChart() {
    this.axis = d3.svg.axis();
    this.line = d3.svg.line();
}

// Stores and provides default config options
BaseChart.prototype.setToDefaultParams = function () {
    var defaultParams = {
        // Margins, padding and spacing
        margin: {top: 10, right: 10, bottom: 10, left: 10},
        padding: {left: 100, right: 50, top: 50, bottom: 100},
        ordinalPadding: 0.5,
        legendSpacing: 18,
        dy: {middle: "0.35em", top: "0.71em", xAxisLabel: "-0.20em", yAxisLabel: "1.00em"},
        // Color and opacity
        colorRange: ["#37B34A", "#008CCF", "#671E75", "#CB333B", "#ED8B00"],
        baseColor: "#EBEBEB",
        opacity: {start: 0.1, end: 0.6},
        // Element sizes
        radius: {normal: 7, large: 10},
        // Transitions
        transition: {duration: 1250, durationShort: 500, delay: 100},
        // Axis
        ticks: {widthCutoff: 500, upper: 4, lower: 2}
    };

    for (var prop in defaultParams) {
        if (defaultParams.hasOwnProperty(prop)) {
            this.config[prop] = defaultParams[prop];
        }
    }

    // Set color range
    this.setColorRange();

    // Set width and height params
    this.setWidthHeight();
};

// Computes and sets width/height params from chart width/height
BaseChart.prototype.setWidthHeight = function () {
    this.config.outerWidth = parseInt(this.config.chart.style("width"));
    this.config.outerHeight = parseInt(this.config.chart.style("height"));
    this.config.width = this.config.outerWidth - this.config.margin.left - this.config.margin.right - this.config.padding.left - this.config.padding.right;
    this.config.height = this.config.outerHeight - this.config.margin.top - this.config.margin.bottom - this.config.padding.top - this.config.padding.bottom;

    this.config.axisPlacement.x = this.config.height - (2.5 * this.config.radius.large);
    this.config.axisPlacement.y = -2.5 * this.config.radius.large;

    // Set x-axis tick count
    this.axis.ticks(this.tickCount());
};

// Set color range
BaseChart.prototype.setColorRange = function () {
    this.config.colorScale.range(this.config.colorRange);
};

// Public setters for chart parameters and config
BaseChart.prototype.setConfig = function () {
    var chartParent = this.args.chartParent,
        chartData = this.args.chartData,
        chart = d3.select(chartParent);

    // Margins, padding and spacing
    var outerWidth, outerHeight, margin, padding, width, height,
        ordinalPadding, legendSpacing, axisPlacement = {}, dy = {};

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
        legendSpacing: legendSpacing,
        axisPlacement: axisPlacement,
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
};

// Public getters for chart parameters and config
BaseChart.prototype.getConfig = function () {
    return this.config;
};

// Creates SVG chart-container
BaseChart.prototype.addChartContainer = function () {
    this.destroyChart(); // Destroy existing chart first

    this.svg = this.config.chart.append("svg")
        .attr("class", "chart-container")
        .attr("width", this.config.outerWidth)
        .attr("height", this.config.outerHeight)
        .append("g")
        .attr("transform", "translate(" + this.config.margin.left + "," + this.config.margin.top + ")");
};

// Adds chart title
BaseChart.prototype.addChartTitle = function () {
    // Extract chart title
    this.chartTitle = this.config.chartData.chart.title.text;

    this.svg.append("g")
        .attr("class", "chartTitle")
        .attr("transform", "translate( " + (this.config.padding.left + this.config.width + this.config.padding.right) / 2 + ", " + 0 + ")")
        .append("text")
        .text(this.chartTitle)
        .attr("dy", this.config.dy.top);
};

// Adds chart legend
BaseChart.prototype.addChartLegend = function () {
    var self = this;

    this.legend = this.svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate (" + (this.config.padding.left + this.config.width - this.config.radius.large) + ", " + (this.config.padding.top + this.config.height + this.config.radius.large) + ")")
        .selectAll(".legendItems")
        .data(d3.keys(self.seriesData))
        .enter().append("g")
        .attr("class", "legendItems");

    this.legend.append("circle")
        .attr("class", "legendCircle")
        .attr("r", self.config.radius.normal)
        .attr("cx", self.config.radius.large)
        .attr("cy", function (d, i) {
            return self.config.legendSpacing * i;
        })
        .style("fill", function (d) {
            return self.config.colorScale(d);
        })
        //animated items
        .style({
            "stroke": self.config.baseColor,
            "fill-opacity": self.config.opacity.start,
            "pointer-events": "none"
        })
        .transition()
        .delay(function (d, i) {
            return i * self.config.transition.delay;
        })
        .duration(self.config.transition.duration)
        .style({
            "stroke": function (d) {
                return self.config.colorScale(d);
            },
            "fill-opacity": self.config.opacity.end
        })
        .each("end", function () {
            d3.select(this).style("pointer-events", null);
        });

    this.legend.append("text")
        .attr("class", "legendLabel")
        .text(function (d) {
            return self.seriesData[d].name;
        })
        .attr("y", function (d, i) {
            return self.config.legendSpacing * i;
        })
        .attr("x", -0.5 * self.config.radius.large)
        .attr("dy", self.config.dy.middle)
        .style("pointer-events", "none")
        .transition()
        .delay(function (d, i) {
            return i * self.config.transition.delay;
        })
        .duration(self.config.transition.duration)
        .each("end", function () {
            d3.select(this).style("pointer-events", null);
        });
};

// Adds data labels
BaseChart.prototype.addLabel = function (elem) {
    var self = this;
    elem.append("text")
        .attr("class", "dataLabels")
        .attr("y", -1.5 * self.config.radius.large)
        .text(function (d) {
            return d.value.toFixed(2);
        })
        .classed("activeText", true);
};

// Returns number of axis ticks based on chart width
BaseChart.prototype.tickCount = function () {
    return (this.config.width > this.config.ticks.widthCutoff) ? this.config.ticks.upper : this.config.ticks.lower;
};

// Adds reset button to chart
BaseChart.prototype.addResetBtn = function () {
    this.resetBtn = this.config.chart.append("input")
        .attr("type", "button")
        .attr("value", "Reset")
        .attr("class", "reset-btn btn btn-sm");
};

// Set button display styles
BaseChart.prototype.setBtnDisplay = function (btn, v) {
    if (v) {
        btn.style("display", null);
    } else {
        btn.style("display", "none");
    }
};

// Delete specified selection
BaseChart.prototype.removeSelection = function (elem) {
    this.config.chart.selectAll(elem).remove();
}

// Destroy all chart elements
BaseChart.prototype.destroyChart = function () {
    var self = this;
    self.removeSelection("*");
    d3.select(window).on("resize" + "." + self.config.chartParent, null); //remove resize listener for this chart from 'window'
};

// Process chart data
BaseChart.prototype.processChartData = function () {
    this.dimensions = {};
    this.seriesData = {};
    this.x = {};
    this.xSpacingInY = {};

    var self = this;

    // Extract xAxis.axes
    if (self.config.chartData.xAxis != null) {
        self.dimensions.x = {};
        self.config.chartData.xAxis.axes.forEach(function (d, i) {
            self.dimensions.x[d.name] = {};
            self.dimensions.x[d.name].type = "x";
            self.dimensions.x[d.name].parameters = d.parameters;
            self.dimensions.x[d.name].dataObjects = [];
            self.dimensions.x[d.name].calcs = {};
            self.dimensions.x[d.name].calcs.floorXpx = 0; // Set floorXpx to 0
            self.x[d.name] = d3.scale.linear().range([self.dimensions.x[d.name].calcs.floorXpx, self.config.width]);
        });
        self.xSpacingInY = d3.scale.ordinal().domain(d3.keys(self.dimensions.x));
    }

    // If provided multiple x-axes, ignore yAxis inputs
    if (d3.keys(self.dimensions.x).length > 1) {
        // Place x-axes vertically across chart height
        self.xSpacingInY.rangePoints([0, self.config.height], self.config.ordinalPadding)
        // Otherwise, extract y-axes and add to dimensions
    } else {
        // Fix x-axis placement
        self.xSpacingInY.range([self.config.axisPlacement.x, self.config.axisPlacement.x]);
        // Extract yAxis.axes
        if (self.config.chartData.yAxis != null) {
            self.dimensions.y = {};
            this.y = {};
            self.config.chartData.yAxis.axes.forEach(function (d, i) {
                self.dimensions.y[d.name] = {};
                self.dimensions.y[d.name].type = "y";
                self.dimensions.y[d.name].parameters = d.parameters;
                self.dimensions.y[d.name].dataObjects = [];
                self.dimensions.y[d.name].calcs = {};
                self.y[d.name] = d3.scale.linear().range([self.config.height, 0]);
            })
        }
    }

    // Extract series.data
    self.config.chartData.series.data.forEach(function (d, i) {
        self.seriesData[i] = {};    // 'i' serves as unique index for seriesData
        self.seriesData[i].name = d.name;
        self.seriesData[i].dataObjects = [];

        // Processs series.data.data
        d.data.forEach(function (dd, ii) {
            // Check if xAxisName property is defined
            if (dd.xAxisName != null) {
                // Cross-reference against xAxis.axes
                if (self.dimensions.x[dd.xAxisName] != null) {
                    var obj = {
                        seriesIndex: i,
                        seriesName: d.name,
                        axisName: dd.xAxisName,
                        value: dd.x
                    };
                    self.seriesData[i].dataObjects.push(obj);
                    self.dimensions.x[dd.xAxisName].dataObjects.push(obj);
                }
                // Check if x and y values are defined
            } else if ((dd.x != null) && (dd.y != null)) {
                // Check that only one x- and y-axis is defined
                if ((d3.keys(self.dimensions.x).length === 1) && (d3.keys(self.dimensions.y).length === 1)) {
                    var xAxisName = d3.keys(self.dimensions.x)[0];
                    var yAxisName = d3.keys(self.dimensions.y)[0];

                    var obj = {
                        seriesIndex: i,
                        seriesName: d.name,
                        xValue: dd.x,
                        xAxisName: xAxisName,
                        yValue: dd.y,
                        yAxisName: yAxisName
                    };
                    self.seriesData[i].dataObjects.push(obj);

                    var objX = {
                        seriesIndex: i,
                        seriesName: d.name,
                        axisName: xAxisName,
                        value: dd.x
                    };
                    self.dimensions.x[xAxisName].dataObjects.push(objX);

                    var objY = {
                        seriesIndex: i,
                        seriesName: d.name,
                        axisName: yAxisName,
                        value: dd.y
                    };
                    self.dimensions.y[yAxisName].dataObjects.push(objY);
                }
            }
        });
    });

    // Map colors to series.data index
    this.config.colorScale.domain(d3.keys(self.seriesData));

    // Calculate axes domains
    for (var axisType in self.dimensions) {
        if(!self.dimensions.hasOwnProperty(axisType)) {
            continue;
        }
        for (var axis in self.dimensions[axisType]) {
            if(!self.dimensions[axisType].hasOwnProperty(axis)) {
                continue;
            }
            // Compute extent from data
            self.dimensions[axisType][axis].calcs.origExtent = d3.extent(self.dimensions[axisType][axis].dataObjects.map(function (d) {
                return d.value;
            }));
            // Incorporate min parameter
            self.dimensions[axisType][axis].calcs.origExtent[0] = d3.min([self.dimensions[axisType][axis].calcs.origExtent[0], self.dimensions[axisType][axis].parameters.min]);
            // Incorporate max parameter
            self.dimensions[axisType][axis].calcs.origExtent[1] = d3.max([self.dimensions[axisType][axis].calcs.origExtent[1], self.dimensions[axisType][axis].parameters.max]);

            // Set domains
            var extent = self.dimensions[axisType][axis].calcs.origExtent;
            if (axisType === "x") {
                self.x[axis].domain(extent);
            } else if (axisType === "y") {
                self.y[axis].domain(extent);
            }
        }
    }
};

// Adds x and y axes
BaseChart.prototype.addChartAxes = function () {
    var self = this;

    // Process x axes
    if (d3.keys(self.dimensions.x).length > 0) {
        // Add a group element for each x-axis
        self.xAxes = self.svg.selectAll(".x-axis")
            .data(d3.keys(self.dimensions.x))
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (p) {
                return "translate( " + self.config.padding.left + ", " + (self.config.padding.top + self.xSpacingInY(p)) + ")";
            });

        // Add x-axes
        self.xAxes.append("g")
            .attr("class", "axis")
            .each(function (p) {
                d3.select(this)
                    .transition()
                    .duration(self.config.transition.duration)
                    .call(self.axis.orient("bottom").scale(self.x[p]));
            });

        var axisLabel = self.xAxes.append("text")
            .attr("class", "axisLabel")
            .text(function (p) {
                return self.dimensions.x[p].parameters.displayName;
            });

        // Add x-axis titles
        if (d3.keys(self.dimensions.x).length > 1) {
            axisLabel.attr("x", -1 * self.config.radius.large);
        } else {
            axisLabel.attr("x", self.config.width)
                .attr("dy", self.config.dy.xAxisLabel);
        }
    }

    // Process y axes
    if (d3.keys(self.dimensions.y).length > 0) {
        // Add a group element for y-axis
        self.yAxis = self.svg.selectAll(".y-axis")
            .data(d3.keys(self.dimensions.y))
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", "translate( " + self.config.padding.left + ", " + (self.config.padding.top + self.config.axisPlacement.y) + ")");

        // Add y-axis
        self.yAxis.append("g")
            .attr("class", "axis")
            .each(function (p) {
                d3.select(this)
                    .transition()
                    .duration(self.config.transition.duration)
                    .call(self.axis.orient("left").scale(self.y[p]));
            });

        // Add y-axis title
        self.yAxis.append("text")
            .attr("class", "axisLabel")
            .attr("transform", "rotate(-90)")
            .attr("dy", self.config.dy.yAxisLabel)
            .text(function (p) {
                return self.dimensions.y[p].parameters.displayName;
            });
    }
};

// Parent draw function to generate basic chart layout
BaseChart.prototype.draw = function () {
    // Create SVG to house chart
    this.addChartContainer();

    // Add reset button and hide
    this.addResetBtn();
    this.setBtnDisplay(this.resetBtn, false);

    // Add chart title
    this.addChartTitle();

    // Process chart data and create x/y scales
    this.processChartData();

    // Add legend
    this.addChartLegend();

    // Add chart axes
    this.addChartAxes();
};


/* RulerChart */

// Define RulerChart class
function RulerChart(args) {
    this.args = args;
    this.setConfig(args); // call config setter inside constructor
}

// Inherit from BaseChart
RulerChart.inheritsFrom(BaseChart);

// RulerChart's draw function
RulerChart.prototype.draw = function () {

    // Call parent draw function for basic chart layout
    this.parent.draw.call(this);

    // Set convenience variables
    var config = this.getConfig();
    var svg = this.svg;
    var resetBtn = this.resetBtn;

    // Carry 'this' context in 'self'
    var self = this;

    // Add circles to x-axis dimensions
    this.xAxes.each(function (p) {
        d3.select(this).selectAll(".g-circle")
            .data(self.dimensions.x[p].dataObjects)
            .enter().append("g")
            .attr("class", "g-circle")
            .attr("transform", "translate(0, 0)")
            .append("circle")
            .attr("class", "circle")
            .attr("r", config.radius.normal)
            .attr("cx", 0)
            .style({
                "stroke": config.baseColor,
                "fill-opacity": config.opacity.start,
                "fill": function (d) {
                    return config.colorScale(d.seriesIndex);
                },
                "pointer-events": "none"
            });

        d3.select(this).selectAll(".g-circle")
            .transition()
            .delay(function (d, i) {
                return i * config.transition.delay;
            })
            .duration(config.transition.duration)
            .attr("transform", function (d) {
                return "translate(" + self.x[p](d.value) + "," + 0 + ")";
            });

        d3.select(this).selectAll(".circle")
            .transition()
            .delay(function (d, i) {
                return i * config.transition.delay;
            })
            .duration(config.transition.duration)
            .style({
                "stroke": function (d) {
                    return config.colorScale(d.seriesIndex);
                },
                "fill-opacity": config.opacity.end
            })
            .each("end", function () {
                d3.select(this).style("pointer-events", null);
            });
    });

    // Add listeners to circles
    svg.selectAll(".g-circle")
        .on("mouseover", function (d) {
            // Increase circle radius
            d3.select(this).select(".circle").attr("r", config.radius.large);

            // Add data label
            self.addLabel(d3.select(this));

            // Highlight related dimension's axis label
            d3.select(this.parentNode).select(".axisLabel").classed("activeText", true);

            // Highlight legend.
            self.legend.filter(function (p) {
                return +p === +d.seriesIndex;
            })
                .each(function (p) {
                    d3.select(this).select(".legendCircle").attr("r", config.radius.large);
                    d3.select(this).select(".legendLabel").classed("activeText", true);
                });

            // Add line connecting dimensions.
            self.drawLine(+d.seriesIndex);
        })
        .on("mouseout", function () {
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
        .on("click", function (d) {
            // Update line class in order to retain.
            self.setMainLine();

            // Remove labels
            self.removeSelection(".dataLabels");

            // Recompute x axis domains, centering on data value of clicked circle.
            self.recenterDomains(+d.seriesIndex);

            // Transition clicked circle instantaneously to avoid conflicts with listeners.
            d3.select(this).attr("transform", "translate(" + self.x[d.axisName](d.value) + "," + 0 + ")");

            // Re-draw and animate x axes and circles using new domains.
            self.reScale();

            // Animate lines.
            self.centerMainLine(+d.seriesIndex);

            // Unhighlight legend and axis labels.
            self.legend.selectAll(".legendLabel").classed("activeText", false);
            svg.selectAll(".axisLabel").classed("activeText", false);

            // Display reset button.
            self.setBtnDisplay(resetBtn, true);
        });

    // Add listeners to legend
    svg.selectAll(".legendItems")
        .on("mouseover", function (p) {
            // Highlight legend.
            d3.select(this).select(".legendCircle").attr("r", config.radius.large);
            d3.select(this).select(".legendLabel").classed("activeText", true);

            // Animate circles for matching portfolio and add labels.
            svg.selectAll(".g-circle")
                .filter(function (d) {
                    return +d.seriesIndex === +p;
                })
                .each(function (d) {
                    d3.select(this).select(".circle").attr("r", config.radius.large);
                    self.addLabel(d3.select(this));
                });

            // Highlight axis labels.
            svg.selectAll(".axisLabel").classed("activeText", true);

            // Add line.
            self.drawLine(+p);
        })
        .on("mouseout", function () {
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
        .on("click", function (p) {
            // Update line class in order to retain.
            self.setMainLine();

            // Remove labels.
            self.removeSelection(".dataLabels");

            // Recompute x axis domains, centering on data value of clicked circle.
            self.recenterDomains(+p);

            // Re-draw and animate x axes and circles using new domains.
            self.reScale();

            // Animate lines.
            self.centerMainLine(+p);

            // Display reset button.
            self.setBtnDisplay(resetBtn, true);
        });

    // Reset chart to original scale on button click
    resetBtn.on("click", function () {
        // Hide reset button.
        self.setBtnDisplay(resetBtn, false);

        // Remove lines and labels.
        self.removeLines();
        svg.select(".line.main").remove();
        self.removeSelection(".dataLabels");

        // Reset x axis domain to original extent.
        d3.keys(self.dimensions.x).map(function (p) {
            self.dimensions.x[p].calcs.floorXpx = 0;
            self.x[p].range([self.dimensions.x[p].calcs.floorXpx, config.width]).domain(self.dimensions.x[p].calcs.origExtent);
        });

        // Re-draw and animate x axes and circles using new domains.
        self.reScale();
    });

    // Resize chart on window resize
    // https://github.com/mbostock/d3/wiki/Selections#on
    // To register multiple listeners for the same event type, the type may be followed by an optional namespace...
    d3.select(window).on("resize" + "." + self.config.chartParent, function () {
        self.reSize();
    });
};

// Draws path across dimensions
RulerChart.prototype.drawLine = function (d) {
    var self = this;
    self.svg.append("path")
        .attr("class", "line")
        .attr("transform", "translate( " + self.config.padding.left + ", " + self.config.padding.top + ")")
        .attr("d", self.path(d))
        .style("pointer-events", "none")
        .style("stroke", self.config.colorScale(d));
};

// Returns the path for a given data point
RulerChart.prototype.path = function (d) {
    var self = this;
    return self.line(d3.keys(self.dimensions.x).map(function (p) {
        return [self.x[p](self.seriesData[d].dataObjects.filter(function (dd) {
            return dd.axisName === p;
        })[0].value), self.xSpacingInY(p)];
    }));
};

// Sets main line class
RulerChart.prototype.setMainLine = function () {
    this.svg.select(".line.main").remove();
    this.svg.select(".line").attr("class", "line main");
};

// Removes all lines except the main line
RulerChart.prototype.removeLines = function () {
    this.svg.selectAll(".line")
        .filter(function () {
            return d3.select(this).attr("class") != "line main";
        })
        .remove();
};

// Recomputes domains, centering on passed data
RulerChart.prototype.recenterDomains = function (d) {
    var minMax, centerVal, distFromCenter, maxDistFromCenter;
    var self = this;

    d3.keys(self.dimensions.x).map(function (p) {
        // Reset scale to original state
        self.dimensions.x[p].calcs.floorXpx = 0;
        self.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width]).domain(self.dimensions.x[p].calcs.origExtent);

        // Recompute scale, centering on selected series
        minMax = self.x[p].domain();
        centerVal = self.seriesData[d].dataObjects.filter(function (dd) {
            return dd.axisName === p;
        })[0].value;
        distFromCenter = [Math.abs(centerVal - minMax[0]), Math.abs(minMax[1] - centerVal)];
        maxDistFromCenter = d3.max(distFromCenter);
        self.x[p].domain([centerVal - maxDistFromCenter, centerVal + maxDistFromCenter]);

        // Adjust for axis floor parameter
        if ((centerVal - maxDistFromCenter) < self.dimensions.x[p].parameters.floor) {
            self.dimensions.x[p].calcs.floorXpx = self.x[p](self.dimensions.x[p].parameters.floor);
            self.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width]).domain([self.dimensions.x[p].parameters.floor, centerVal + maxDistFromCenter]);
        }
    });
};

// Redraws axes and circles
RulerChart.prototype.reScale = function () {
    var self = this;
    self.xAxes.each(function (p) {
        d3.select(this).selectAll(".axis")
            .transition()
            .duration(self.config.transition.durationShort)
            .call(self.axis.scale(self.x[p]));

        d3.select(this).selectAll(".g-circle")
            .style("pointer-events", "none")
            .transition()
            .duration(self.config.transition.durationShort)
            .attr("transform", function (d) {
                return "translate(" + self.x[p](d.value) + "," + 0 + ")";
            })
            .each("end", function () {
                d3.select(this).style("pointer-events", null);
            });
    });
};

// Centers the main line
RulerChart.prototype.centerMainLine = function (d) {
    var self = this;
    this.svg.select(".line.main")
        .transition()
        .duration(self.config.transition.durationShort)
        .attr("d", self.path(d));
};

// Resizes chart
RulerChart.prototype.reSize = function () {
    var self = this;

    // Recompute width and height from chart width and height.
    this.setWidthHeight();

    // Update svg width and height.
    this.config.chart.select(".chart-container")
        .attr("width", self.config.outerWidth)
        .attr("height", self.config.outerHeight);

    // Update chart title placement.
    this.svg.select(".chartTitle")
        .attr("transform", "translate( " + (self.config.padding.left + self.config.width + self.config.padding.right) / 2 + ", " + (self.config.padding.top / 2) + ")");

    // Update x and y ranges.
    this.xSpacingInY.rangePoints([0, self.config.height], self.config.ordinalPadding);
    d3.keys(self.dimensions.x).map(function (p) {
        self.x[p].range([self.dimensions.x[p].calcs.floorXpx, self.config.width]);
    });

    // Update dimension related elements
    this.xAxes.each(function (p) {
        // Update y spacing.
        d3.select(this)
            .attr("transform", function (p) {
                return "translate( " + self.config.padding.left + ", " + (self.config.padding.top + self.xSpacingInY(p)) + ")"
            });

        // Update x axes.
        d3.select(this).selectAll(".axis")
            .each(function (p) {
                d3.select(this).call(self.axis.scale(self.x[p]));
            });

        // Update x values for circles.
        d3.select(this).selectAll(".g-circle")
            .attr("transform", function (d) {
                return "translate(" + self.x[p](d.value) + "," + 0 + ")";
            });
    });

    // Update legend location.
    this.svg.select(".legend")
        .attr("transform", "translate (" + (self.config.padding.left + self.config.width - self.config.radius.large) + ", " + (self.config.padding.top + self.config.height + self.config.radius.large) + ")");

    // Remove centered line (can't figure out rescaling)
    this.svg.select(".line.main").remove();
};


/* ScatterPlot */

// Define ScatterPlot class
function ScatterPlot(args) {
    this.args = args;
    this.setConfig(args); // call config setter inside constructor
}

// Inherit from BaseChart
ScatterPlot.inheritsFrom(BaseChart);

// RulerChart's draw function
ScatterPlot.prototype.draw = function () {

    // Call parent draw function for basic chart layout
    this.parent.draw.call(this);

    // Set convenience variables
    var config = this.getConfig();
    var svg = this.svg;
    var resetBtn = this.resetBtn;

    // Carry 'this' context in 'self'
    var self = this;

    // Add g element for each data series
    var series = svg.selectAll(".g-series")
        .data(d3.keys(self.seriesData))
        .enter().append("g")
        .attr("class", "g-series")
        .attr("transform", "translate( " + config.padding.left + ", " + (config.padding.top + config.height - 2 * config.radius.large) + ")");

    // Add circles
    series.each(function (p) {
        d3.select(this).selectAll(".g-circle")
            .data(self.seriesData[p].dataObjects)
            .enter().append("g")
            .attr("class", "g-circle")
            .append("circle")
            .attr("class", "circle")
            .attr("r", config.radius.normal)
            .attr("cx", 0)
            .style({
                "stroke": config.baseColor,
                "fill-opacity": config.opacity.start,
                "fill": function (d) {
                    return config.colorScale(d.seriesIndex);
                },
                "pointer-events": "none"
            });

        d3.select(this).selectAll(".g-circle")
            .transition()
            .delay(function (d, i) {
                return i * config.transition.delay;
            })
            .duration(config.transition.duration)
            .attr("transform", function (d) {
                return "translate(" + self.x[d.xAxisName](d.xValue) + "," + (self.y[d.yAxisName](d.yValue) - config.height) + ")";
            });

        d3.select(this).selectAll(".circle")
            .transition()
            .delay(function (d, i) {
                return i * config.transition.delay;
            })
            .duration(config.transition.duration)
            .style({
                "stroke": function (d) {
                    return config.colorScale(d.seriesIndex);
                },
                "fill-opacity": config.opacity.end
            })
            .each("end", function () {
                d3.select(this).style("pointer-events", null);
            });
    });
};