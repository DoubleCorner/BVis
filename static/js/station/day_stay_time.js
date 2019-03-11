/**
 * Created by Corner on 2017/4/4.
 */
function DayStayTimeClass(day_data_map, date) {
  var div_width = 50;
  var div_height = 15;
  var height = $("#day_stay_time").height() - div_height;
  var width = $("#day_stay_time").width() - div_width;
  var padding = {left: 20, right: 20, top: 20, bottom: 20};
  var data_map = d3.map();
  var radius = Math.min(width / 2, height / 2) - padding.left;
  var level = 4;
  var total = 24;
  var colors = ["#2EC7C9", "#B6A2DE", "#5AB1EF", "#FFB980", "#D87A80",
    "#8D98B3", "#E5CF0D", "#97B552", "#95706D", "#DC69AA",
    "#07A2A4", "#9A7FD1", "#588DD5", "#F5994E", "#C05050",
    "#59678C", "#C9AB00", "#7EB00A", "#6F5553", "#C14089"];


  var min_value = 0;
  day_data_map.forEach(function (key, value) {
    var values = [];
    for (var i = 0; i !== total; ++i) {
      values.push({axis: i, value: 0});
    }
    value.forEach(function (d) {
      var hour = d.x.getHours();
      values[hour].value += d.y;
    });
    data_map.set(key, values);
  });
  var max_value = 0;
  data_map.forEach(function (key, value) {
    var max = d3.max(value, function (d) {
      return d.value;
    });
    if (max_value < max)
      max_value = max;
  });
  var arc = 2 * Math.PI;
  var one_axis = arc / total;
  var web_points_list = [];
  var points_radar_map = [];
  var text_points = [];

  d3.select("body")
    .select("#day_stay_time")
    .selectAll("svg")
    .remove();

  d3.select("body")
    .select("#day_stay_time")
    .select("div")
    .remove();

  d3.select("body")
    .select("#day_stay_time")
    .append("div")
    .attr("class", "time_info")
    .style("width", width + "px")
    .text(date.toDateString());

  var legend_svg = d3.select("body")
    .select("#day_stay_time")
    .append("svg")
    .attr("class", "legend_routes");

  var svg = d3.select("body")
    .select("#day_stay_time")
    .append("svg")
    .style("position", "absolute")
    .style("top", div_height + "px")
    .style("left", div_width + "px")
    .style("width", width + "px")
    .style("height", height + "px")
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  for (var j = level; j > 0; j--) {
    var web_points = [];
    var r = radius / level * j;
    for (var i = 0; i < total; i++) {
      var x = r * Math.sin(i * one_axis),
        y = r * Math.cos(i * one_axis);
      web_points.push({
        x: x,
        y: y
      });
    }
    web_points_list.push(web_points);
  }

  var line = d3.svg.line()
    .x(function (d) {
      return d.x;
    })
    .y(function (d) {
      return d.y;
    })
    .interpolate("basis-closed");

  svg.append("g")
    .selectAll(".web_circle")
    .data(web_points_list)
    .enter()
    .append("path")
    .attr("d", function (d) {
      return line(d);
    })
    .style("fill", "#C8C8C8")
    .style("fill-opacity", 0.5)
    .style("stroke", "gray");

  svg.append("g")
    .selectAll("line")
    .data(web_points_list[0])
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", function (d, i) {
      if (i % 3 === 0)
        return d.x;
      return 0;
    })
    .attr("y2", function (d, i) {
      if (i % 3 === 0)
        return d.y;
      return 0;
    })
    .style("stroke", "snow");

  data_map.forEach(function (key, values) {
    var points_radar = [];
    values.forEach(function (d, i) {
      var time = radius * ((d.value - min_value) / (max_value - min_value));
      var px = time * Math.sin(i * one_axis);
      var py = time * Math.cos(i * one_axis);
      points_radar.push({
        x: px,
        y: py
      });
    });
    points_radar_map.push({route_id: key, value: points_radar});
  });

  svg.append("g")
    .selectAll(".route_chart")
    .data(points_radar_map)
    .enter()
    .append("path")
    .attr("class", "day_stay_chart")
    .attr("id", function (d) {
      return "day_stay_chart_" + d.route_id;
    })
    .attr("d", function (d) {
      return line(d.value);
    })
    .style("stroke", function (d, i) {
      return colors[i];
    })
    .style("stroke-width", "2px")
    .style("fill", function (d, i) {
      return colors[i];
    })
    .style("fill-opacity", 0.6);

  var cell_size = (height + div_height - 20) / 20;

  var legend_g = legend_svg.append("g")
    .selectAll(".route_legend")
    .data(points_radar_map)
    .enter();

  legend_g.append("rect")
    .attr("x", 10)
    .attr("y", function (d, i) {
      return i * cell_size + 10;
    })
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", function (d, i) {
      return colors[i];
    })
    .on("mouseover", function (d) {
      d3.select("#day_stay_time")
        .selectAll(".day_stay_chart")
        .style("visibility", "hidden");
      d3.select("#day_stay_time")
        .select("#day_stay_chart_" + d.route_id)
        .style("fill-opacity", 0.8)
        .style("visibility", "visible");
    })
    .on("mouseout", function (d) {
      d3.select("#day_stay_time")
        .selectAll(".day_stay_chart")
        .style("visibility", "visible");
      d3.select("#day_stay_time")
        .select("#day_stay_chart_" + d.route_id)
        .style("fill-opacity", 0.6);
    });

  legend_g.append("text")
    .attr("class", "routes_label")
    .attr("x", 25)
    .attr("y", function (d, i) {
      return i * cell_size + 18;
    })
    .text(function (d) {
      return d.route_id;
    });

  for (i = 0; i !== total; ++i) {
    text_points.push({x: (radius + 10) * Math.sin(i * one_axis), y: (radius + 10) * Math.cos(i * one_axis)});
  }
  svg.append("g")
    .selectAll("text")
    .data(text_points)
    .enter()
    .append("text")
    .attr("x", function (d) {
      return d.x;
    })
    .attr("y", function (d) {
      return d.y;
    })
    .attr("text-anchor", "middle")
    .attr("dy", "2px")
    .style("fill", "black")
    .style("font-family", "sans-serif")
    .style("font-size", "8px")
    .style("font-weight", "bold")
    .text(function (d, i) {
      return i;
    });
}