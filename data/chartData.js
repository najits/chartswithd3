var rulerChartData1 = {
    chart: {
        title: {
            text: "Portfolio Characteristics & Exposures"
        },
        placeholder: "For chart level options"
    },
    xAxis: {
        placeholder: "For Global x-Axis properties",
            axes: [
            {
                name: "incomeYield",
                parameters: {
                    min: 0,
                    max: 5,
                    floor: 0,
                    displayName: "Income Yield"
                }
            },
            {
                name: "expense",
                parameters: {
                    min: 0,
                    max: 1,
                    floor: 0,
                    displayName: "Expense Ratio"
                }
            },
            {
                name: "risk_total",
                parameters: {
                    min: 0,
                    max: 12,
                    floor: 0,
                    displayName: "Total Risk"
                }
            },
            {
                name: "oad",
                parameters: {
                    min: 0,
                    max: 7,
                    displayName: "Duration"
                }
            }
        ]
    },
    series: {
        placeholder: "For Global series properties",
            data: [
            {
                name: "GIC Tactical Asset Allocation Model 6",
                data: [
                    {
                        xAxisName: "incomeYield",
                        x: 2.20001683726
                    },
                    {
                        xAxisName: "expense",
                        x: 0
                    },
                    {
                        xAxisName: "risk_total",
                        x: 12.463279194068054
                    },
                    {
                        xAxisName: "oad",
                        x: 0.2666
                    }
                ]
            },
            {
                name: "GIC Tactical Asset Allocation Model 6",
                data: [
                    {
                        xAxisName: "incomeYield",
                        x: 2.21001683726
                    },
                    {
                        xAxisName: "expense",
                        x: 0.06
                    },
                    {
                        xAxisName: "risk_total",
                        x: 12.54
                    },
                    {
                        xAxisName: "oad",
                        x: -0.2666
                    }
                ]
            },
            {
                name: "Long-Term Allocation ETF 40/60",
                data: [
                    {
                        xAxisName: "incomeYield",
                        x: 3.00435302271
                    },
                    {
                        xAxisName: "expense",
                        x: 0.10140000000000002
                    },
                    {
                        xAxisName: "risk_total",
                        x: 6.2706826905590605
                    },
                    {
                        xAxisName: "oad",
                        x: 2.9985
                    }
                ]
            },
            {
                name: "Long-Term Allocation ETF 70/30",
                data: [
                    {
                        xAxisName: "incomeYield",
                        x: 2.61565915641
                    },
                    {
                        xAxisName: "expense",
                        x: 0.10540000000000001
                    },
                    {
                        xAxisName: "risk_total",
                        x: 10.528992636646464
                    },
                    {
                        xAxisName: "oad",
                        x: 1.4775000000000003
                    }
                ]
            },
            {
                name: "Long-Term Allocation ETF 90/10",
                data: [
                    {
                        xAxisName: "incomeYield",
                        x: 2.2660096221
                    },
                    {
                        xAxisName: "expense",
                        x: 0.09270000000000002
                    },
                    {
                        xAxisName: "risk_total",
                        x: 13.363294601069397
                    },
                    {
                        xAxisName: "oad",
                        x: 0.507
                    }
                ]
            }
        ]
    }
};

var rulerChartData2 = {
    chart: {
        title: {
            text: "Portfolio Characteristics & Exposures 2"
        },
        placeholder: "For chart level options"
    },
    xAxis: {
        placeholder: "For Global x-Axis properties",
            axes: [
            {
                name: "incomeYield",
                parameters: {
                    min: 0,
                    max: 5,
                    floor: 0,
                    displayName: "Income Yield"
                }
            },
            {
                name: "oad",
                parameters: {
                    min: -1,
                    max: 7,
                    displayName: "Duration"
                }
            },
            {
                name: "risk_total",
                parameters: {
                    min: 0,
                    max: 15,
                    floor: 0,
                    displayName: "Total Risk"
                }
            },
            {
                name: "ig_beta",
                parameters: {
                    min: -5,
                    max: 5,
                    displayName: "IG Beta"
                }
            }
        ]
    },
    series: {
        placeholder: "For Global series properties",
            data: [
            {
                name: "GIC Tactical Asset Allocation Model 6",
                data: [
                    {
                        xAxisName: "incomeYield",
                        x: 2.20001683726
                    },
                    {
                        xAxisName: "ig_beta",
                        x: 4.5
                    },
                    {
                        xAxisName: "expense",
                        x: 0
                    },
                    {
                        xAxisName: "risk_total",
                        x: 12.463279194068054
                    },
                    {
                        xAxisName: "oad",
                        x: 0.2666
                    }
                ]
            },
            {
                name: "High Quality and Dividend",
                data: [
                    {
                        xAxisName: "incomeYield",
                        x: 2.2424999999999997
                    },
                    {
                        xAxisName: "ig_beta",
                        x: 1.25
                    },
                    {
                        xAxisName: "expense",
                        x: 0
                    },
                    {
                        xAxisName: "risk_total",
                        x: 14.069455231422165
                    },
                    {
                        xAxisName: "oad",
                        x: 0
                    }
                ]
            },
            {
                name: "Long-Term Allocation ETF 40/60",
                data: [
                    {
                        xAxisName: "incomeYield",
                        x: 3.00435302271
                    },
                    {
                        xAxisName: "ig_beta",
                        x: -2.222
                    },
                    {
                        xAxisName: "expense",
                        x: 0.10140000000000002
                    },
                    {
                        xAxisName: "risk_total",
                        x: 6.2706826905590605
                    },
                    {
                        xAxisName: "oad",
                        x: 2.9985
                    }
                ]
            },
            {
                name: "Long-Term Allocation ETF 70/30",
                data: [
                    {
                        xAxisName: "incomeYield",
                        x: 2.61565915641
                    },
                    {
                        xAxisName: "ig_beta",
                        x: -4.2
                    },
                    {
                        xAxisName: "expense",
                        x: 0.10540000000000001
                    },
                    {
                        xAxisName: "risk_total",
                        x: 10.528992636646464
                    },
                    {
                        xAxisName: "oad",
                        x: 1.4775000000000003
                    }
                ]
            },
            {
                name: "Long-Term Allocation ETF 90/10",
                data: [
                    {
                        xAxisName: "incomeYield",
                        x: 2.2660096221
                    },
                    {
                        xAxisName: "ig_beta",
                        x: 0
                    },
                    {
                        xAxisName: "expense",
                        x: 0.09270000000000002
                    },
                    {
                        xAxisName: "risk_total",
                        x: 13.363294601069397
                    },
                    {
                        xAxisName: "oad",
                        x: 0.507
                    }
                ]
            }
        ]
    }
};

var scatterPlotData1 = {
    chart: {
        title: {
            text: "Scatter Plot of Income Yield vs. Total Risk"
        },
        placeholder: "For chart level options"
    },
    xAxis: {
        placeholder: "For Global x-Axis properties",
            axes: [
            {
                name: "risk_total",
                parameters: {
                    min: 0,
                    max: 15,
                    floor: 0,
                    displayName: "Total Risk"
                }
            }
        ]
    },
    yAxis: {
        placeholder: "For Global y-Axis properties",
            axes: [
            {
                name: "incomeYield",
                parameters: {
                    min: 0,
                    max: 5,
                    floor: 0,
                    displayName: "Income Yield"
                }
            }
        ]
    },
    series: {
        placeholder: "For Global series properties",
            data: [
            {
                name: "Portfolio Awesome",
                data: [
                    {
                        x: 17.463279194068054,
                        y: 2.20001683726
                    },
                    {
                        x: 7.463279194068054,
                        y: 4
                    }
                ]
            },
            {
                name: "High Quality and Dividend",
                data: [
                    {
                        x: 14.069455231422165,
                        y: 2.2424999999999997
                    }
                ]
            },
            {
                name: "Long-Term Allocation ETF 40/60",
                data: [
                    {
                        x: 6.2706826905590605,
                        y: 3.00435302271
                    }
                ]
            },
            {
                name: "Long-Term Allocation ETF 70/30",
                data: [
                    {
                        x: 10.528992636646464,
                        y: 2.61565915641
                    }
                ]
            },
            {
                name: "Long-Term Allocation ETF 90/10",
                data: [
                    {
                        x: 13.363294601069397,
                        y: 2.2660096221
                    }
                ]
            }
        ]
    }
};
