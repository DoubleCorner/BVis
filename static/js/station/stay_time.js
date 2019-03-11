/**
 * Created by Corner on 2017/3/18.
 */
function StayTimeClass() {
    //要显示停车时间的站点编号
    var self = this;
    var stream_show = true;
    var layer_set = [];
    var data_map = d3.map();
    var div_width = 80;
    var width = $("#stay_time").width();
    var height = $("#stay_time").height();
    var svg = null;
    var vertical_line = null;
    var padding = {left: 35, right: 40, top: 20, bottom: 20};
    var colors = ["#2EC7C9", "#B6A2DE", "#5AB1EF", "#FFB980", "#D87A80",
        "#8D98B3", "#E5CF0D", "#97B552", "#95706D", "#DC69AA",
        "#07A2A4", "#9A7FD1", "#588DD5", "#F5994E", "#C05050",
        "#59678C", "#C9AB00", "#7EB00A", "#6F5553", "#C14089"];
    var div = d3.select("body")
        .select("#stay_time")
        .append("div")
        .style("visibility", "hidden")
        .style("width", div_width + "px")
        .style("height", height + "px");

    div.append("button")
        .style("cursor", "default")
        .attr("class", "stay_button")
        .text("Stream")
        .on("click", function () {
            if (!stream_show) {
                clearLastDraw();
                drawStreamGraph();
                stream_show = !stream_show;
            }
        });

    var station_info = div.append("div")
        .attr("class", "station_info");

    var tooltip = div.append("div")
        .attr("class", "stay_tooltip");

    StayTimeClass.prototype.showStationStayTime = function (station) {
        $.ajax({
            type: "get",
            url: "/station_run_data",
            dataType: "json",
            async: true,
            contentType: "application/json",
            data: {
                "station_id": station.station_id
            },
            success: function (data) {
                handleData(data);
                div.style("visibility", "visible");
                station_info.html("<p>" + station.station_name + "<br>" + station.station_id + "</p>");
                stream_show = true;
                drawStreamGraph();
                drawDayGraph(new Date("2016-1-1"));
                significant_view.showStationIndex(station);
            },
            Error: function () {
                console.log("获取数据失败");
            }
        });
    };
    this.showStationStayTime(stations_info[0]);

    function handleData(data) {
        clearLastDraw();
        clearLastData();
        var values = [];
        for (var i = 0; i !== data.length; ++i) {
            if (!data_map.has(data[i].route_id)) {
                values = [];
            } else {
                values = data_map.get(data[i].route_id);
            }
            values.push({
                "x": new Date(data[i].end_date_time),
                "y": data[i].stay_time
            });
            data_map.set(data[i].route_id, values);
        }
        var stack_set = [];
        data_map.forEach(function (key, value) {
            var one_stack = {
                "route_id": key,
                "stay_time": []
            };
            for (var j = 0; j !== 31; ++j) {
                one_stack.stay_time.push({"date": new Date("2016-1-" + (j + 1)), "time": 0, "route_id": key});
            }
            for (var i = 0; i !== value.length; ++i) {
                var date = parseInt(value[i].x.getDate());
                for (j = 0; j !== 31; ++j) {
                    if (date === j + 1) {
                        one_stack.stay_time[j].time += value[i].y;
                        break;
                    }
                }
            }
            stack_set.push(one_stack);
        });
        var stack = d3.layout.stack()
            .values(function (d) {
                return d.stay_time;
            })
            .x(function (d) {
                return d.date;
            })
            .y(function (d) {
                return d.time;
            });
        layer_set = stack(stack_set);
    }

    function drawOneRouteGraph(route_time_list, route_id, color) {
        tooltip.html("<p>" + "route : " + route_id + "<br>" + "flow : " + route_time_list.length + "</p>");

        var x_range_width = width - div_width - padding.left - padding.right;

        var x_scale = d3.time.scale()
            .domain([new Date("2016-1-1"), new Date("2016-2-1")])
            .range([0, x_range_width]);


        var y_range_height = height - padding.top - padding.bottom;

        var y_scale = d3.scale.sqrt()
            .domain([0, d3.max(route_time_list, function (d) {
                return d.y;
            })])
            .range([y_range_height, 0]);

        var zoom = d3.behavior.zoom()
            .x(x_scale)
            .scaleExtent([1, 256])
            .on("zoom", function () {
                var start = x_scale.domain()[0];
                var end = x_scale.domain()[1];
                var flow = 0;
                route_time_list.forEach(function (d) {
                    if (d.x >= start && d.x <= end) {
                        flow++;
                    }
                });
                tooltip.html("<p>" + "route : " + route_id + "<br>" + "flow : " + flow + "</p>");
                svg.select(".x.axis").call(x_axis);
                svg.select("#area").attr("d", area);
            });

        svg = d3.select("body")
            .select("#stay_time")
            .append("svg")
            .style("position", "absolute")
            .style("top", "0px")
            .style("left", div_width + "px")
            .style("width", (width - div_width) + "px")
            .style("height", height + "px")
            .call(zoom);

        var x_axis = d3.svg.axis()
            .scale(x_scale)
            .orient("bottom");

        var y_axis = d3.svg.axis()
            .scale(y_scale)
            .orient("left");

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + padding.left + "," + (height - padding.bottom) + ")")
            .call(x_axis);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
            .call(y_axis)
            .append("text")
            .text("parking time /s")
            .attr("x", -5)
            .attr("y", -5);

        var area = d3.svg.area()
            .x(function (d) {
                return x_scale(d.x);
            })
            .y0(y_range_height)
            .y1(function (d) {
                return y_scale(d.y);
            })
            .interpolate("basis");

        var area_path = svg.append("g")
            .attr("transform", "translate(" + padding.left + "," + padding.top + ")");

        area_path.append("clipPath")
            .attr("id", "clip_stay_time")
            .append("rect")
            .attr({x: 0, y: 0, width: x_range_width, height: y_range_height});

        area_path.append("path")
            .datum(route_time_list)
            .attr("d", area)
            .attr("fill", color)
            .attr("fill-opacity", 0.5)
            .attr("stroke", color)
            .attr("id", "area")
            .attr("clip-path", "url(#clip_stay_time)");
    }

    function drawStreamGraph() {

        var x_range_width = width - div_width - padding.left - padding.right;

        var x_scale = d3.time.scale()
            .domain([new Date("2015-12-31 23:00:00"), new Date("2016-1-31 01:00:00")])
            .range([0, x_range_width]);

        var y_range_width = height - padding.top - padding.bottom;

        var y_range = d3.max(layer_set[layer_set.length - 1].stay_time, function (d) {
            return d.y0 + d.y;
        });
        var y_scale = d3.scale.linear()
            .domain([0, y_range])
            .range([y_range_width, 0]);

        var x_axis = d3.svg.axis()
            .scale(x_scale)
            .orient("bottom")
            .ticks(d3.time.day);

        var y_axis = d3.svg.axis()
            .scale(y_scale)
            .tickFormat(function (d) {
                return d;
            });

        svg = d3.select("body")
            .select("#stay_time")
            .append("svg")
            .style("position", "absolute")
            .style("top", "0px")
            .style("left", div_width + "px")
            .attr("width", (width - div_width))
            .attr("height", height);

        var area = d3.svg.area()
            .interpolate("cardinal")
            .x(function (d) {
                return x_scale(d.date);
            })
            .y0(function (d) {
                return y_scale(d.y0);
            })
            .y1(function (d) {
                return y_scale(d.y0 + d.y);
            });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + padding.left + "," + (height - padding.bottom) + ")")
            .call(x_axis);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + (padding.left + x_range_width) + "," + (padding.top) + ")")
            .call(y_axis.orient("right"));

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
            .call(y_axis.orient("left"))
            .append("text")
            .text("parking time /s")
            .attr("x", -5)
            .attr("y", -5);

        svg.selectAll(".river")
            .data(layer_set)
            .enter()
            .append("path")
            .attr("d", function (d) {
                return area(d.stay_time);
            })
            .attr("fill", function (d, i) {
                return colors[i];
            })
            .style("fill-opacity", 1)
            .attr("transform", "translate(" + padding.left + "," + (padding.top - 1) + ")")
            .on("mouseover", function (d) {
                if (!d)
                    return;
                d3.select(this)
                    .style("fill-opacity", 0.5);
            })
            .on("mousemove", function (d) {
                if (!d)//边缘出现错误,d值为空
                    return;
                var mouse_x = d3.mouse(this);
                mouse_x = mouse_x[0];
                var inverted = x_scale.invert(mouse_x);
                var date = inverted.getDate();
                var layer = d.stay_time;
                for (var j = 0; j !== layer.length; ++j) {
                    if (layer[j].date.getDate() === date) {
                        drawDayGraph(layer[j].date);
                        tooltip.html("<p>" + "route : " + d.route_id + "<br>" + "time : " + layer[j].time + "</p>");
                        break;
                    }
                }
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("fill-opacity", 1);
            })
            .on("click", function (d) {
                if (!d)//边缘出现错误,d值为空
                    return;
                var mouse_x = d3.mouse(this);
                mouse_x = mouse_x[0];
                var inverted = x_scale.invert(mouse_x);
                var date = inverted.getDate();
                var layer = d.stay_time;
                for (var j = 0; j !== layer.length; ++j) {
                    if (layer[j].date.getDate() === date) {
                        clearLastDraw();
                        drawOneRouteGraph(data_map.get(layer[j].route_id), layer[j].route_id, d3.select(this).attr("fill"));
                        stream_show = !stream_show;
                        break;
                    }
                }
            });

        vertical_line = d3.select("#stay_time")
            .append("div")
            .attr("class", "vertical_line")
            .style("height", y_range_width + "px")
            .style("top", padding.top + "px")
            .style("left", (x_range_width / 2) + "px");

        d3.select("#stay_time")
            .on("mousemove", function () {
                var mouse_x = d3.mouse(this);
                mouse_x = mouse_x[0];
                if (mouse_x >= (div_width + padding.left) && mouse_x <= (div_width + padding.left + x_range_width)) {
                    vertical_line.style("visibility", "visible");
                    vertical_line.style("left", (mouse_x - 5) + "px");
                } else {
                    vertical_line.style("visibility", "hidden");
                }
            })
            .on("mouseover", function () {
                var mouse_x = d3.mouse(this);
                mouse_x = mouse_x[0];
                if (mouse_x >= (div_width + padding.left) && mouse_x <= (div_width + padding.left + x_range_width)) {
                    vertical_line.style("visibility", "visible");
                    vertical_line.style("left", (mouse_x - 5) + "px");
                } else {
                    vertical_line.style("visibility", "hidden");
                }
            });

    }

    function clearLastDraw() {
        if (svg) {
            svg.remove();
            svg = null;
        }
        if (vertical_line) {
            vertical_line.remove();
            vertical_line = null;
            //移除鼠标
            d3.select("#stay_time")
                .on("mousemove", function () {
                })
                .on("mouseover", function () {
                });
        }
    }

    function clearLastData() {
        layer_set = [];
        data_map.forEach(function (key) {
            data_map.remove(key);
        });
    }

    function drawDayGraph(date) {
        var day = date.getDate();
        var day_data_map = d3.map();
        data_map.forEach(function (key, value) {
            var day_data = [];
            value.forEach(function (d) {
                if (d.x.getDate() === day) {
                    day_data.push(d);
                }
            });
            day_data_map.set(key, day_data);
        });
        DayStayTimeClass(day_data_map, date);
    }
}