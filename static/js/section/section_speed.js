/**
 * Created by Corner on 2017/5/4.
 */
function SectionSpeedClass() {
  var height = $("#section").height();
  var width = $("#section").width();
  var padding = {top: 20, right: 20, bottom: 10, left: 50};
  var color = ["#9E0142", "#D53E4F", "#F46D43", "#FDAE61", "#FEE08B", "#F6FAAA", "#E6F598", "#ABDDA4", "#60C278", "#00B400", "#008000"];
  var color_scale = d3.scale.quantile()
    .domain([5, 10, 15, 20, 25, 30, 35, 40, 45])
    .range(color);//最大速度设置为60 km/h
  var data_set = [];
  var cells = null;
  var cell_size = 15;
  var cells_width = cell_size * 24;
  var cells_height = cell_size * 31;
  var x_scale = d3.scale.linear()
    .domain([0, 24])
    .range([0, cells_width]);

  var x_axis = d3.svg.axis()
    .orient("top")
    .tickFormat(d3.format("02d"))
    .ticks(24)
    .scale(x_scale);

  var y_scale = d3.time.scale()
    .domain([new Date("2016-1-1"), new Date("2016-2-1")])
    .range([0, cells_height]);

  var y_axis = d3.svg.axis()
    .orient("left")
    .scale(y_scale)
    .ticks(d3.time.day);

  var svg = d3.select("body")
    .select("#section")
    .append("svg")
    .attr("width", width)
    .attr("height", padding.top + cells_height + padding.bottom);

  var x_axis_draw = svg.append("g")
    .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
    .attr("class", "x axis")
    .call(x_axis)
    .style("visibility", "hidden");

  var y_axis_draw = svg.append("g")
    .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
    .attr("class", "y axis")
    .call(y_axis)
    .style("visibility", "hidden");

  var label_div = d3.select("#section")
    .append("div")
    .style("width", width + "px")
    .style("visibility", "hidden");

  var tip_svg = label_div.append("svg")
    .attr("id", "linear_label");

  tip_svg.selectAll(".tip")
    .data(color)
    .enter()
    .append("rect")
    .attr("x", function (d, i) {
      return i * 10 + 10;
    })
    .attr("y", 5)
    .attr("width", 9)
    .attr("height", 9)
    .style("fill", function (d) {
      return d;
    });

  tip_svg.append("text")
    .attr("x", 10)
    .attr("y", 25)
    .attr("class", "font_label")
    .text("slow");

  tip_svg.append("text")
    .attr("x", 100)
    .attr("y", 25)
    .attr("class", "font_label")
    .text("fast");

  var section_info = label_div.append("div")
    .attr("id", "section_info");

  var tooltip = label_div.append("div")
    .attr("id", "speed_tip");

  var one_hour_svg_width = width - 150;
  var one_hour_svg_height = height - padding.top - padding.bottom - cells_height;
  var one_hour_svg = null;

  SectionSpeedClass.prototype.getSectionAllSpeed = function (section) {
    $.ajax({
      type: "get",
      url: "/section_run_data/one_section",
      dataType: "json",
      async: true,
      contentType: "application/json",
      data: {
        "section_id": section.section_id
      },
      success: function (speed_list) {
        section_info.html("<p>" + section.from_name + " —— " + section.target_name + " " + section.distance + "m</p>");
        label_div.style("visibility", "visible");
        handleData(speed_list);
        drawSpeedHeatMap();
      },
      Error: function () {
        console.log("获取数据失败");
      }
    });
  };
  this.getSectionAllSpeed(sections_info[0]);

  function handleData(speed_list) {
    data_set = [];
    for (var i = 1; i !== 32; ++i) {
      for (var j = 0; j !== 24; j++) {
        data_set.push({day: i, hour: j, speed: []});
      }
    }
    speed_list.forEach(function (item) {
      var date_time = new Date(item.end_date_time);
      var hour = date_time.getHours();
      var day = date_time.getDate();
      for (var i = 0; i !== data_set.length; ++i) {
        if (data_set[i].day === day && data_set[i].hour === hour) {
          data_set[i].speed.push({
            velocity: item.speed,
            minute: date_time.getMinutes(),
            second: date_time.getSeconds()
          });
          break;
        }
      }
    });
  }

  function drawSpeedHeatMap() {
    x_axis_draw.style("visibility", "visible");
    y_axis_draw.style("visibility", "visible");
    if (cells !== null) {
      cells.remove();
    }
    cells = svg.selectAll(".cell")
      .data(data_set)
      .enter()
      .append("rect")
      .attr("width", cell_size - 1)
      .attr("height", cell_size - 1)
      .attr("x", function (d) {
        return x_scale(d.hour);
      })
      .attr("y", function (d) {
        return y_scale(new Date("2016-1-" + d.day));
      })
      .attr("transform", "translate(" + (padding.left + 1) + "," + (padding.top + 1) + ")")
      .attr("fill", function (d) {
        if (d.speed.length !== 0) {
          var ave_speed = 0;
          d.speed.forEach(function (s) {
            ave_speed += s.velocity;
          });
          ave_speed = (ave_speed / d.speed.length).toFixed(2);
          return color_scale(ave_speed);
        }
        else
          return "gray";
      })
      .on("mouseover", function () {
        d3.select(this).style("opacity", 0.5);
      })
      .on("mouseout", function () {
        d3.select(this).style("opacity", 1);
      })
      .on("click", function (d) {
        var ave_speed = 0;
        if (d.speed.length !== 0) {
          d.speed.forEach(function (s) {
            ave_speed += s.velocity;
          });
          ave_speed = (ave_speed / d.speed.length).toFixed(2);
          tooltip.html("<p>" + "2016-1-" + d.day + " " + d.hour + "h - " + (d.hour + 1) + "h<br>MS : " + ave_speed + " km/h</p>");
          drawOneHourMap(d, color_scale(ave_speed));
        }
        else {
          tooltip.html("<p>" + "2016-1-" + d.day + " " + d.hour + "h - " + (d.hour + 1) + "h<br>MS : no data" + "</p>");
        }
      })
  }

  function drawOneHourMap(item, color) {
    if (one_hour_svg) {
      one_hour_svg.remove();
      one_hour_svg = null;
    }
    one_hour_svg = label_div.append("svg")
      .attr("id", "one_hour_svg")
      .style("top", (padding.top + padding.bottom + cells_height) + "px")
      .style("width", one_hour_svg_width + "px")
      .style("height", one_hour_svg_height + "px");

    var margin = {left: 35, right: 20, top: 5, bottom: 20};
    var xx_scale = d3.time.scale()
      .domain([new Date(2016, 0, item.day, item.hour, 0, 0), new Date(2016, 0, item.day, item.hour + 1, 0, 0)])
      .range([0, one_hour_svg_width - margin.left - margin.right]);

    var min_speed = d3.min(item.speed, function (d) {
      return d.velocity;
    });
    var max_speed = d3.max(item.speed, function (d) {
      return d.velocity;
    });
    var yy_scale = d3.scale.linear()
      .domain([min_speed, max_speed])
      .range([one_hour_svg_height - margin.top - margin.bottom, 0]);

    var xx_axis = d3.svg.axis()
      .scale(xx_scale)
      .orient("bottom")
      .ticks(d3.time.minutes, 10);

    var yy_axis = d3.svg.axis()
      .scale(yy_scale)
      .tickValues([min_speed.toFixed(2),
        (min_speed + (max_speed - min_speed) / 4).toFixed(2),
        (min_speed + (max_speed - min_speed) / 4 * 2).toFixed(2),
        (min_speed + (max_speed - min_speed) / 4 * 3).toFixed(2),
        max_speed.toFixed(2)])
      .tickFormat(d3.format(".0"))
      .orient("left");

    one_hour_svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(" + margin.left + "," + (one_hour_svg_height - margin.bottom) + ")")
      .call(xx_axis);

    one_hour_svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(yy_axis.orient("left"));

    var area = d3.svg.area()
      .x(function (d) {
        return xx_scale(new Date(2016, 0, item.day, item.hour, d.minute, d.second));
      })
      .y0(one_hour_svg_height - margin.top - margin.bottom)
      .y1(function (d) {
        return yy_scale(d.velocity);
      })
      .interpolate("basis");

    var area_path = one_hour_svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + (margin.top - 1) + ")");

    area_path.append("clipPath")
      .attr("id", "clip_section_speed")
      .append("rect")
      .attr({
        x: 0,
        y: 0,
        width: one_hour_svg_width - margin.left - margin.right,
        height: one_hour_svg_height - margin.top - margin.bottom
      });

    area_path.append("path")
      .attr({
        "d": area(item.speed),
        "stroke": color,
        "fill": color,
        "clip-path": "url(#clip_section_speed)"
      });
  }
}