/**
 * Created by Corner on 2017/4/20.
 */
function SignificantClass() {
  var width = $("#significant").width();
  var height = $("#significant").height();
  var DN_result_max = 0;
  var add_degree_max = 0;
  var join_degree_max = 0;
  var degree_max = 0;
  var in_degree_max = 0;
  var out_degree_max = 0;
  var routes_num_max = 0;

  var DN_result_ave = 0;
  var add_degree_ave = 0;
  var join_degree_ave = 0;
  var degree_ave = 0;
  var in_degree_ave = 0;
  var out_degree_ave = 0;
  var routes_num_ave = 0;

  var assessment_max = 1;

  var one_index_height = 50;
  var legend_height = 20;
  var rect_height = 25;
  var value_height = 10;

  var margin = {top: 10, right: 15, bottom: 10, left: 100};
  var padding = 15;
  var svg = null;
  var filter_height = 90;
  var list_index;
  var now_station;

  var day_data = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
    "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th",
    "21st", "22nd", "23rd", "24th", "25th", "26th", "27th", "28th", "29th", "30th", "31st"];
  var hour_data = ["12 am", "01 am", "02 am", "03 am", "04 am", "05 am", "06 am", "07 am", "08 am", "09 am", "10 am", "11 am",
    "12 pm", "01 pm", "02 pm", "03 pm", "04 pm", "05 pm", "06 pm", "07 pm", "08 pm", "09 pm", "10 pm", "11 pm"];

  station_sign_info.forEach(function (item) {
    if (DN_result_max < item.DN_result)
      DN_result_max = item.DN_result;

    if (add_degree_max < item.add_degree)
      add_degree_max = item.add_degree;

    if (join_degree_max < item.join_degree)
      join_degree_max = item.join_degree;

    if (degree_max < item.degree)
      degree_max = item.degree;

    if (in_degree_max < item.in_degree)
      in_degree_max = item.in_degree;

    if (out_degree_max < item.out_degree)
      out_degree_max = item.out_degree;

    if (routes_num_max < item.routes_num)
      routes_num_max = item.routes_num;

    DN_result_ave += item.DN_result;
    add_degree_ave += item.add_degree;
    join_degree_ave += item.join_degree;
    degree_ave += item.degree;
    in_degree_ave += item.in_degree;
    out_degree_ave += item.out_degree;
    routes_num_ave += item.routes_num;
  });
  DN_result_ave = parseFloat((DN_result_ave / station_sign_info.length).toFixed(2));
  add_degree_ave = parseFloat((add_degree_ave / station_sign_info.length).toFixed(2));
  join_degree_ave = parseFloat((join_degree_ave / station_sign_info.length).toFixed(2));
  degree_ave = parseFloat((degree_ave / station_sign_info.length).toFixed(2));
  in_degree_ave = parseFloat((in_degree_ave / station_sign_info.length).toFixed(2));
  out_degree_ave = parseFloat((out_degree_ave / station_sign_info.length).toFixed(2));
  routes_num_ave = parseFloat((routes_num_ave / station_sign_info.length).toFixed(2));
  station_sign_info.sort(compare_DN);
  drawFilter();
  SignificantClass.prototype.showStationIndex = function (station) {
    for (var i = 0; i !== station_sign_info.length; ++i) {
      if (station_sign_info[i].station_id === station.station_id) {
        now_station = station.station_id;
        list_index = [];
        list_index = [
          {
            title: "out-degree",
            value: station_sign_info[i].out_degree,
            average: out_degree_ave,
            max: out_degree_max
          },
          {
            title: "in-degree",
            value: station_sign_info[i].in_degree,
            average: in_degree_ave,
            max: in_degree_max
          },
          {
            title: "degree",
            value: station_sign_info[i].degree,
            average: degree_ave,
            max: degree_max
          },
          {
            title: "adjacent-degree",
            value: station_sign_info[i].join_degree,
            average: join_degree_ave,
            max: join_degree_max
          },
          {
            title: "add-degree",
            value: station_sign_info[i].add_degree,
            average: add_degree_ave,
            max: add_degree_max
          },
          {
            title: "DN-result",
            value: station_sign_info[i].DN_result,
            average: DN_result_ave,
            index: i,
            max: DN_result_max
          },
          {
            title: "route-number",
            value: station_sign_info[i].routes_num,
            average: routes_num_ave,
            max: routes_num_max
          },
          {
            title: "stay-time",
            value: 0,
            average: station_sign_info[i].stay_time_ave,
            index: 0,
            max: station_sign_info[i].stay_time_max
          },
          {
            title: "traffic-flow",
            value: 0,
            average: station_sign_info[i].traffic_flow_ave,
            index: 0,
            max: station_sign_info[i].traffic_flow_max
          },
          {
            title: "assess-result",
            value: 0,
            average: 0,
            max: assessment_max
          }
        ];
        update();
        break;
      }
    }
  };

  function drawFilter() {
    var filter_div = d3.select("#significant")
      .append("div")
      .style("position", "relative")
      .style("width", width + "px")
      .style("height", filter_height + "px");

    filter_div.append("span")
      .attr("class", "se_label")
      .style("left", "15px")
      .style("top", "13px")
      .text("start");

    filter_div.append("span")
      .attr("class", "se_label")
      .style("left", "15px")
      .style("top", "57px")
      .text("end");

    filter_div.append("select")
      .attr("class", "select")
      .attr("id", "select_start_day")
      .style("top", "10px")
      .style("left", (width / 6) + "px")
      .selectAll(".option_start_day")
      .data(day_data)
      .enter()
      .append("option")
      .attr("class", "option")
      .text(function (d) {
        return d;
      });

    filter_div.append("select")
      .attr("class", "select")
      .attr("id", "select_start_hour")
      .style("top", "10px")
      .style("left", (width / 6 * 2.5) + "px")
      .selectAll(".option_start_hour")
      .data(hour_data)
      .enter()
      .append("option")
      .attr("class", "option")
      .text(function (d) {
        return d;
      });

    filter_div.append("select")
      .attr("class", "select")
      .attr("id", "select_end_day")
      .style("top", "55px")
      .style("left", (width / 6) + "px")
      .selectAll(".option_end_day")
      .data(day_data)
      .enter()
      .append("option")
      .attr("class", "option")
      .text(function (d) {
        return d;
      });
    $("#select_end_day").val("31st");

    filter_div.append("select")
      .attr("class", "select")
      .attr("id", "select_end_hour")
      .style("top", "55px")
      .style("left", (width / 6 * 2.5) + "px")
      .selectAll(".option_end_hour")
      .data(hour_data)
      .enter()
      .append("option")
      .attr("class", "option")
      .text(function (d) {
        return d;
      });
    $("#select_end_hour").val("11 pm");

    filter_div.append("button")
      .attr("id", "update_button")
      .style("left", (width / 6 * 4.2) + "px")
      .text("update")
      .on("click", update);
  }

  function drawStationIndex() {
    if (svg !== null) {
      svg.remove();
      svg = null;
    }
    var scale = d3.scale.linear()
      .range([0, width - margin.left - margin.right]);
    var axis = d3.svg.axis()
      .orient("bottom");

    svg = d3.select("#significant")
      .append("svg")
      .attr("width", width)
      .attr("height", height - filter_height);

    var groups = svg.selectAll("g")
      .data(list_index)
      .enter()
      .append("g");

    groups.append("rect")
      .attr("width", function (d) {
        scale.domain([0, d.max]);
        return scale(d.max);
      })
      .attr("height", rect_height)
      .attr("transform", function (d, i) {
        return "translate(" + margin.left + "," + (i * one_index_height + margin.top) + ")";
      })
      .attr("fill", "#EEEEEE");

    groups.append("rect")
      .attr("width", function (d) {
        scale.domain([0, d.max]);
        return scale(d.average);
      })
      .attr("height", rect_height)
      .attr("transform", function (d, i) {
        return "translate(" + margin.left + "," + (i * one_index_height + margin.top) + ")";
      })
      .attr("fill", "#CCCCCC");

    groups.append("rect")
      .attr("width", function (d) {
        scale.domain([0, d.max]);
        return scale(d.value);
      })
      .attr("height", value_height)
      .attr("transform", function (d, i) {
        return "translate(" + margin.left + "," + (i * one_index_height + margin.top + 7.5) + ")";
      })
      .attr("fill", "steelblue");

    groups.append("text")
      .attr("x", margin.left - 5)
      .attr("y", function (d, i) {
        return i * one_index_height + margin.top + 17;
      })
      .attr("class", "title")
      .attr("fill", function (d) {
        if (d.title === "assess-result")
          return "blue";
      })
      .text(function (d) {
        return d.title;
      });

    groups.append("g")
      .attr("class", "axis")
      .attr("transform", function (d, i) {
        scale.domain([0, d.max]);
        axis.scale(scale)
          .tickValues([0, d.max / 4, d.max / 4 * 2, d.max / 4 * 3, d.max])
          .tickFormat(d3.format(".0"));
        d3.select(this).call(axis);
        return "translate(" + margin.left + "," + (i * one_index_height + margin.top + rect_height) + ")"
      });

    var legend = svg.selectAll(".label")
      .data([{title: "value", color: "steelblue"},
        {title: "max", color: "#EEEEEE"},
        {title: "average", color: "#CCCCCC"}])
      .enter()
      .append("g")
      .attr("class", "assessment_legend");

    legend.append("rect")
      .attr("width", (width - padding * 2) / 3)
      .attr("height", legend_height)
      .attr("transform", function (d, i) {
        return "translate(" + (padding + i * ((width - padding * 2) / 3)) + "," + (list_index.length * one_index_height + padding) + ")";
      })
      .attr("fill", function (d) {
        return d.color;
      });
    legend.append("text")
      .attr("transform", function (d, i) {
        return "translate(" + (padding + i * ((width - padding * 2) / 3)) + "," + (list_index.length * one_index_height + padding + 12.5) + ")";
      })
      .attr("class", "title")
      .style("text-anchor", "start")
      .text(function (d) {
        return d.title;
      });
  }

  function update() {
    var update_sort_list = [];
    var start_day = day_data.indexOf(d3.select("#select_start_day").property("value"));
    var start_hour = hour_data.indexOf(d3.select("#select_start_hour").property("value"));
    var end_day = day_data.indexOf(d3.select("#select_end_day").property("value"));
    var end_hour = hour_data.indexOf(d3.select("#select_end_hour").property("value"));
    if (end_day < start_day || end_hour < start_hour) {
      alert("your select is wrong!");
      return;
    }
    //找到其在所有站点的排序位置
    station_sign_info.forEach(function (item) {
      var every_hour_list = JSON.parse(item.every_hour_list);
      var select_list = [];
      every_hour_list.forEach(function (row, i) {
        if (i >= start_day && i <= end_day) {
          row.forEach(function (col, j) {
            if (j >= start_hour && j <= end_hour) {
              select_list.push(col);
            }
          });
        }
      });
      var time_value = d3.mean(select_list, function (d) {
        return d.time;
      });
      var flow_value = d3.mean(select_list, function (d) {
        return d.flow;
      });
      update_sort_list.push({station_id: item.station_id, time: time_value, flow: flow_value});
    });
    update_sort_list.sort(compare_time);
    for (var i = 0; i !== update_sort_list.length; ++i) {
      if (update_sort_list[i].station_id === now_station) {
        list_index[7].index = i + 1;
        list_index[7].value = update_sort_list[i].time;
        break;
      }
    }
    update_sort_list.sort(compare_flow);
    for (i = 0; i !== update_sort_list.length; ++i) {
      if (update_sort_list[i].station_id === now_station) {
        list_index[8].index = i + 1;
        list_index[8].value = update_sort_list[i].flow;
        break;
      }
    }
    calAssessResult();
    drawStationIndex();
  }

  function calAssessResult() {
    //设置每一个指标所占的比例
    var assess_result = 0;
    list_index.forEach(function (item) {
      // 应该使用其排名来进行,最后将排序索引相加，在进行归一化处理即可
      if (item.title === "DN-result")
        assess_result += item.index;
      if (item.title === "stay-time")
        assess_result += item.index;
      if (item.title === "traffic-flow")
        assess_result += item.index;
    });
    assess_result = assess_result / (station_sign_info.length * 3);
    list_index[list_index.length - 1].value = assess_result;
  }

  function compare_DN(object1, object2) {
    var val1 = object1.DN_result;
    var val2 = object2.DN_result;
    if (val1 < val2) {
      return -1;
    } else if (val1 > val2) {
      return 1;
    } else {
      return 0;
    }
  }

  function compare_flow(object1, object2) {
    var val1 = object1.flow;
    var val2 = object2.flow;
    if (val1 < val2) {
      return -1;
    } else if (val1 > val2) {
      return 1;
    } else {
      return 0;
    }
  }

  function compare_time(object1, object2) {
    var val1 = object1.time;
    var val2 = object2.time;
    if (val1 < val2) {
      return -1;
    } else if (val1 > val2) {
      return 1;
    } else {
      return 0;
    }
  }
}