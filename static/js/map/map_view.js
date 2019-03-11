/**
 * Created by Corner on 2017/2/13.
 */
function MapViewClass() {
  var self = this;
  //设置视图容器的高度
  var url_mapbox_dark = 'https://api.mapbox.com/styles/v1/corner/cjegua1r1pzcu2snuxrxg6vk3/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY29ybmVyIiwiYSI6ImNqMHZ1NmM3bTAwMzYycXJzMmdmNjZ3am4ifQ.7oCzveSFDF1eSnm8QcdpXQ';
  var url_mapbox_light = 'https://api.mapbox.com/styles/v1/corner/cjegsgpmnpy382rt5z29voomy/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY29ybmVyIiwiYSI6ImNqMHZ1NmM3bTAwMzYycXJzMmdmNjZ3am4ifQ.7oCzveSFDF1eSnm8QcdpXQ';
  var url_osm = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
  var osmUrl = url_osm,
    osm = L.tileLayer(osmUrl, {
      maxZoom: 17,
      minZoom: 5
    });
  //公有属性：
  self.map = new L.Map('map').addLayer(osm).setView(new L.LatLng(31.457514, 104.753437), 10);
  //工具编号
  self.ctrl_box_type = 0;
  //私有属性
  //站点marker-list
  var station_markers = d3.map();
  //路线marker-list
  var sub_route_markers = d3.map();
  //路段marker-list
  var section_markers = d3.map();
  var mouse_down = false;
  var mouse_move = false;
  var mouse_down_point;
  var mouse_up_point;
  var speed_color = d3.interpolate("red", "green");
  var time_extent = [new Date('2016-1-1'), new Date('2016-2-1')];
  var reflect = d3.scale.linear()
    .domain([5, 45])
    .range([0, 1]);//最大速度设置为45 km/h
  var max_route_num = getRoutesNumberMax();
  var scale = d3.scale.linear()
    .domain([1, max_route_num])
    .range([3, 8]);
  //工具图形
  var graph;
  var now_extent = [0, 0];
  //站点热力图
  var heat_map = null;
  var network_show_flag = false;
  var current_station_marker = null;
  var current_section_marker = null;
  initRouteFlag();
  initStationFlag();
  initSectionFlag();
  createBrush();
  self.map.on('mousedown', onMouseDown);
  self.map.on('mouseup', onMouseUp);
  self.map.on('mousemove', onMouseMove);

  //公有方法
  //绘制站点
  MapViewClass.prototype.showStation = function (station) {
    if (station_markers.get(station.station_id) === null) {
      var latlng = L.latLng(station.latitude, station.longitude);
      var style = stationStyle(station.routes_number);
      var marker = L.circleMarker(latlng, style).bindPopup(newPopupDiv(station)).addTo(self.map);
      marker.on("click", function () {
        stay_time_view.showStationStayTime(station);
        if (current_station_marker !== null)
          current_station_marker.setStyle({fillColor: "#FDBB84"});
        marker.setStyle({fillColor: "#2EE0FF"});
        current_station_marker = marker;
      });
      station_markers.set(station.station_id, marker);
    }
  };

  //绘制一条子线路
  MapViewClass.prototype.showOrUpdateOneSubRoute = function (sub_route_id) {
    sections_info.forEach(function (item) {
      removeSection(item.section_id);
    });
    if (sub_route_markers.get(sub_route_id).length === 0) {
      for (var i = 0; i !== routes_info.length; ++i) {
        if (sub_route_id === routes_info[i].sub_route_id) {
          var sections = routes_info[i].path.split(',');
          for (var j = 0; j !== sections.length; ++j) {
            for (var k = 0; k !== sections_info.length; ++k) {
              if (parseInt(sections[j]) === sections_info[k].section_id) {
                var path = JSON.parse(sections_info[k].path);
                createSectionSpeedWithRoute(sub_route_id, path, sections_info[k]);
                break;
              }
            }
          }
          break;
        }
      }
      //绘制线路站点
      for (i = 0; i !== stations_info.length; ++i) {
        var routes = stations_info[i].sub_routes_id.split(',');
        for (j = 0; j !== routes.length; ++j) {
          if (routes[j] === sub_route_id) {
            self.showStation(stations_info[i]);
            break;
          }
        }
      }
    } else {
      sub_route_markers.get(sub_route_id).forEach(function (item) {
        updateSectionSpeedWithRoute(sub_route_id, item.marker, item.section);
      })
    }
  };

  //绘制站点热力图
  MapViewClass.prototype.showHideHeatStation = function () {
    if (heat_map)
      removeHeatMap();
    else {
      clearSSMap();
      drawHeatMap();
    }
  };

  //绘制公交网络
  MapViewClass.prototype.showHideBusNetwork = function () {
    clearSSMap();
    if (network_show_flag) {
      sections_info.forEach(function (item) {
        removeSection(item.section_id);
      });
      network_show_flag = false;
    }
    else {
      sections_info.forEach(function (item) {
        var path = JSON.parse(item.path);
        createSectionSpeedNoRoute(item, path);
      });
      network_show_flag = true;
    }
  };

  //私有方法
  //删除站点标记
  function removeStation(station_id) {
    if (station_markers.get(station_id) !== null) {
      station_markers.get(station_id).remove();
      station_markers.set(station_id, null);
    }
  }

  //移除子线路轨迹
  function removeSubRoute(sub_route_id) {
    if (sub_route_markers.get(sub_route_id).length !== 0) {
      var section_list = sub_route_markers.get(sub_route_id);
      for (var i = 0; i !== section_list.length; ++i) {
        section_list[i].marker.remove();
      }
      for (i = 0; i !== stations_info.length; ++i) {
        var routes = stations_info[i].sub_routes_id.split(',');
        for (var j = 0; j !== routes.length; ++j) {
          if (routes[j] === sub_route_id) {
            removeStation(stations_info[i].station_id);
            break;
          }
        }
      }
      sub_route_markers.set(sub_route_id, []);
    }
  }

  //移除路段标记（路段分为两种：一种是带有路线信息，一种是不带有路线信息）
  function removeSection(section_id) {
    if (section_markers.get(section_id)) {
      section_markers.get(section_id).remove();
      section_markers.set(section_id, null);
    }
  }

  //更新带有线路信息的路段速度
  function updateSectionSpeedWithRoute(sub_route_id, section_marker, section) {
    $.ajax({
      type: "get",
      url: "/section_run_data/with_route",
      dataType: "json",
      async: true,
      contentType: "application/json",
      data: {
        'sub_route_id': sub_route_id,
        'section_id': section.section_id,
        'start_time': time_extent[0].getTime(),
        'end_time': time_extent[1].getTime()
      },
      success: function (ave_speed) {
        if (ave_speed !== -1) {
          section_marker.setStyle({
            color: speed_color(reflect(ave_speed)),
            weight: 2,
            opacity: 1
          });
        } else {
          section_marker.setStyle({color: "gray", weight: 2, opacity: 1});
        }
      },
      Error: function () {
        console.log("获取数据失败");
      }
    });
  }

  //创建带有线路信息的路段速度
  function createSectionSpeedWithRoute(sub_route_id, path, section) {
    $.ajax({
      type: "get",
      url: "/section_run_data/with_route",
      dataType: "json",
      async: true,
      contentType: "application/json",
      data: {
        'sub_route_id': sub_route_id,
        'section_id': section.section_id,
        'start_time': time_extent[0].getTime(),
        'end_time': time_extent[1].getTime()
      },
      success: function (ave_speed) {
        if (ave_speed !== -1) {
          var section_marker = L.polyline(path, {
            color: speed_color(reflect(ave_speed)),
            weight: 3,
            opacity: 1
          }).bindPopup("ID：" + section.section_id + "<br>" + section.from_name + "——" + section.target_name + "<br>MS : " + ave_speed + " km/h").addTo(self.map);
        }
        else {
          section_marker = L.polyline(path, {
            color: "gray",
            weight: 3,
            opacity: 1
          }).bindPopup("ID：" + section.section_id + "<br>" + section.from_name + "——" + section.target_name + "<br>MS ：no data!").addTo(self.map);
        }
        section_marker.on("click", function () {
          section_speed_view.getSectionAllSpeed(section);
          if (current_section_marker !== null)
            if (ave_speed !== -1)
              current_section_marker.setStyle({weight: 3, color: speed_color(reflect(ave_speed))});
            else
              current_section_marker.setStyle({weight: 3, color: "gray"});
          section_marker.setStyle({weight: 5, color: "#2EE0FF"});
          current_section_marker = section_marker;
        });
        var section_list = sub_route_markers.get(sub_route_id);
        section_list.push({marker: section_marker, section: section});
        sub_route_markers.set(sub_route_id, section_list);
      },
      Error: function () {
        console.log("获取数据失败");
      }
    });
  }

  //更新不带线路信息的路段速度
  function updateSectionSpeedNoRoute(section) {
    $.ajax({
      type: "get",
      url: "/section_run_data/no_route",
      dataType: "json",
      async: true,
      contentType: "application/json",
      data: {
        'section_id': section.section_id,
        'start_time': time_extent[0].getTime(),
        'end_time': time_extent[1].getTime()
      },
      success: function (ave_speed) {
        if (ave_speed !== -1) {
          section_markers.get(section.section_id).setStyle({
            color: speed_color(reflect(ave_speed)),
            weight: 2,
            opacity: 1
          });
        } else {
          section_markers.get(section.section_id).setStyle({color: "gray", weight: 2, opacity: 1});
        }
      }
    });
  }

  //创建不带线路信息的路段速度
  function createSectionSpeedNoRoute(section, path) {
    $.ajax({
      type: "get",
      url: "/section_run_data/no_route",
      dataType: "json",
      async: true,
      contentType: "application/json",
      data: {
        'section_id': section.section_id,
        'start_time': time_extent[0].getTime(),
        'end_time': time_extent[1].getTime()
      },
      success: function (ave_speed) {
        if (ave_speed !== -1) {
          var section_marker = L.polyline(path, {
            color: speed_color(reflect(ave_speed)),
            weight: 2,
            opacity: 1
          }).bindPopup("ID：" + section.section_id + "<br>" + section.from_name + "——" + section.target_name + "<br>MS ：" + ave_speed + " km/h")
            .addTo(self.map)
            .on("click", function () {
              section_speed_view.getSectionAllSpeed(section);
              if (current_section_marker !== null)
                current_section_marker.setStyle({
                  weight: 3,
                  color: speed_color(reflect(ave_speed))
                });
              section_marker.setStyle({weight: 5, color: "#2EE0FF"});
              current_section_marker = section_marker;
            });
        }
        else {
          section_marker = L.polyline(path, {
            color: "gray",
            weight: 2,
            opacity: 1
          }).bindPopup("ID：" + section.section_id + "<br>" + section.from_name + "——" + section.target_name + "<br>MS ：no data!")
            .addTo(self.map)
            .on("click", function () {
              section_speed_view.getSectionAllSpeed(section);
              if (current_section_marker !== null)
                current_section_marker.setStyle({weight: 3, color: "gray"});
              section_marker.setStyle({weight: 5, color: "#2EE0FF"});
              current_section_marker = section_marker;
            });
        }
        section_markers.set(section.section_id, section_marker);
      },
      Error: function () {
        console.log("获取数据失败");
      }
    });
  }

  //初始化站点标记
  function initStationFlag() {
    for (var i = 0; i !== stations_info.length; ++i) {
      station_markers.set(stations_info[i].station_id, null);
    }
  }

  //初始化线路标记
  function initRouteFlag() {
    for (var i = 0; i !== routes_info.length; ++i) {
      sub_route_markers.set(routes_info[i].sub_route_id, []);
    }
  }

  //初始化路段标记
  function initSectionFlag() {
    sections_info.forEach(function (item) {
      section_markers.set(item.section_id, null);
    });
  }

  //图形清为空
  function graphEmpty() {
    if (graph) {
      graph.remove();
      graph = null;
    }
  }

  //设置站点显示的大小
  function stationStyle(r) {
    var stationStyle;
    stationStyle = {
      radius: scale(r),
      fillColor: "#FDBB84",
      color: "black",
      weight: 1,
      opacity: 1,
      fillOpacity: 1
    };
    return stationStyle;
  }

  //创建标记物弹出框
  function newPopupDiv(data) {
    var div = document.createElement('div');
    var station_name = document.createElement('h4');
    station_name.innerHTML = data.station_name + " " + data.station_id;
    var routes_length = document.createElement('h5');
    routes_length.innerHTML = "There are <span style='color:red'>" + data.routes_number + "</span> routes to this station";
    var sub_length = document.createElement('h5');
    sub_length.innerHTML = "There are <span style='color:red'>" + data.sub_routes_number + "</span> sub routes to this station";
    var ul_route = document.createElement('ul');
    ul_route.className = "PopupDivUl";
    var ul_sub = document.createElement('ul');
    ul_sub.className = "PopupDivUl";
    var routes = data.routes_id.split(',');
    for (var i = 0; i !== routes.length; ++i) {
      var li_route = document.createElement('li');
      li_route.className = "PopupDivLi";
      li_route.id = routes[i];
      li_route.innerHTML = "NO." + routes[i] + " ";
      ul_route.appendChild(li_route);
    }
    var sub_routes = data.sub_routes_id.split(',');
    for (i = 0; i !== sub_routes.length; i++) {
      var li_sub = document.createElement('li');
      li_sub.className = "PopupDivLi";
      li_sub.id = sub_routes[i];
      li_sub.innerHTML = "NO." + "<span style='color:blue'>" + sub_routes[i] + " </span>";
      li_sub.onclick = function (i) {
        return function () {
          if (sub_route_markers.get(sub_routes[i]).length === 0) {
            self.showOrUpdateOneSubRoute(sub_routes[i]);
          }
        }
      }(i);
      ul_sub.appendChild(li_sub);
    }
    div.appendChild(station_name);
    div.appendChild(routes_length);
    div.appendChild(ul_route);
    div.appendChild(sub_length);
    div.appendChild(ul_sub);
    return div;
  }

  //创建刷子
  function createBrush() {
    var time_brush_width = $("#time_brush").width();
    var time_brush_height = $("#time_brush").height();
    var time_svg = d3.select("#time_brush")
      .append("svg")
      .attr("width", time_brush_width)
      .attr("height", time_brush_height);
    var padding = {left: 30, right: 30, top: 10, bottom: 20};
    var x_scale = d3.time.scale()
      .domain([new Date('2016-1-1'), new Date('2016-2-1')])
      .range([0, time_brush_width - padding.left - padding.right]);
    var x_axis = d3.svg.axis()
      .scale(x_scale)
      .orient("bottom");

    time_svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(" + padding.left + "," + (time_brush_height - padding.bottom) + ")")
      .call(x_axis);

    function brushEnd() {
      //更新已经显示的路段
      time_extent = brush.extent();
      if (time_extent[0].getTime() === now_extent[0] && time_extent[1].getTime() === now_extent[1]) {
        return false;
      } else {
        now_extent[0] = time_extent[0].getTime();
        now_extent[1] = time_extent[1].getTime();
        sections_info.forEach(function (item) {
          if (section_markers.get(item.section_id) !== null) {
            updateSectionSpeedNoRoute(item);
          }
        });
        routes_info.forEach(function (item) {
          if (sub_route_markers.get(item.sub_route_id).length !== 0) {
            self.showOrUpdateOneSubRoute(item.sub_route_id);
          }
        })
      }
    }

    var brush = d3.svg.brush()
      .x(x_scale)
      .extent(x_scale.domain())
      .on("brushend", brushEnd);
    time_svg.append("g")
      .attr("class", "brush")
      .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
      .call(brush)
      .selectAll("rect").attr("height", time_brush_height - padding.top - padding.bottom);
  }

  function onMouseDown(e) {
    mouse_down = true;
    mouse_move = false;
    mouse_down_point = e.latlng;
    if (self.ctrl_box_type && self.ctrl_box_type !== 5) {
      self.map.dragging.disable();
    } else {
      self.map.dragging.enable();
    }
  }

  function onMouseUp(e) {
    mouse_up_point = e.latlng;
    switch (self.ctrl_box_type) {
      case 0:
        break;
      case 1: {
        if (mouse_move) {
          for (var i = 0; i !== stations_info.length; ++i) {
            if (gpsDistance(stations_info[i].latitude, stations_info[i].longitude, mouse_down_point.lat, mouse_down_point.lng) < graph._mRadius) {
              self.showStation(stations_info[i]);
            }
          }
          for (i = 0; i !== sections_info.length; ++i) {
            var flag = true;
            var path = JSON.parse(sections_info[i].path);
            for (j = 0; j !== path.length; ++j) {
              if (gpsDistance(path[j][0], path[j][1], mouse_down_point.lat, mouse_down_point.lng) > graph._mRadius) {
                flag = false;
                break;
              }
            }
            if (flag) {
              if (section_markers.get(sections_info[i].section_id) !== null)
                updateSectionSpeedNoRoute(sections_info[i]);
              else
                createSectionSpeedNoRoute(sections_info[i], path);
            }

          }
          graphEmpty();
        }
        break;
      }
      case 2: {
        if (mouse_move) {
          for (i = 0; i !== stations_info.length; ++i) {
            if (stations_info[i].latitude < graph._bounds._northEast.lat &&
              stations_info[i].latitude > graph._bounds._southWest.lat &&
              stations_info[i].longitude < graph._bounds._northEast.lng &&
              stations_info[i].longitude > graph._bounds._southWest.lng) {
              self.showStation(stations_info[i]);
            }
          }
          for (i = 0; i !== sections_info.length; ++i) {
            flag = true;
            path = JSON.parse(sections_info[i].path);
            for (j = 0; j !== path.length; ++j) {
              if (path[j][0] > graph._bounds._northEast.lat ||
                path[j][0] < graph._bounds._southWest.lat ||
                path[j][1] > graph._bounds._northEast.lng ||
                path[j][1] < graph._bounds._southWest.lng) {
                flag = false;
                break;
              }
            }
            if (flag)
              if (section_markers.get(sections_info[i].section_id) !== null)
                updateSectionSpeedNoRoute(sections_info[i]);
              else
                createSectionSpeedNoRoute(sections_info[i], path);
          }
          graphEmpty();
        }
        break;
      }
      case 3: {
        if (mouse_move) {
          for (i = 0; i !== stations_info.length; ++i) {
            if (gpsDistance(stations_info[i].latitude, stations_info[i].longitude, mouse_down_point.lat, mouse_down_point.lng) < graph._mRadius) {
              removeStation(stations_info[i].station_id);
              var routes = stations_info[i].sub_routes_id.split(',');
              for (var j = 0; j !== routes.length; ++j) {
                removeSubRoute(routes[j]);
              }
            }
          }
          for (i = 0; i !== sections_info.length; ++i) {
            flag = true;
            path = JSON.parse(sections_info[i].path);
            for (j = 0; j !== path.length; ++j) {
              if (gpsDistance(path[j][0], path[j][1], mouse_down_point.lat, mouse_down_point.lng) > graph._mRadius) {
                flag = false;
                break;
              }
            }
            if (flag)
              removeSection(sections_info[i].section_id);
          }
          graphEmpty();
        }
        break;
      }
      default:
        break;
    }
    mouse_down = false;
    mouse_move = false;
  }

  function onMouseMove(e) {
    if (mouse_down) {
      var position = e.latlng;
      mouse_move = true;
      switch (self.ctrl_box_type) {
        case 0:
          break;
        case 1: {
          graphEmpty();
          var distance = gpsDistance(mouse_down_point.lat, mouse_down_point.lng, position.lat, position.lng);
          graph = L.circle(mouse_down_point, {
            radius: distance,
            weight: 1,
            color: "black",
            fillColor: "black",
            fillOpacity: 0.3
          }).addTo(self.map);
            for (var i = 0; i !== stations_info.length; ++i) {
                if (gpsDistance(stations_info[i].latitude, stations_info[i].longitude, mouse_down_point.lat, mouse_down_point.lng) < graph._mRadius) {
                    self.showStation(stations_info[i]);
                }
            }
          break;
        }
        case 2: {
          graphEmpty();
          var bounds = [[mouse_down_point.lat, mouse_down_point.lng], [position.lat, position.lng]];
          graph = L.rectangle(bounds, {
            weight: 1,
            color: "black",
            fillColor: "black",
            fillOpacity: 0.3
          }).addTo(self.map);
          break;
        }
        case 3: {
          graphEmpty();
          distance = gpsDistance(mouse_down_point.lat, mouse_down_point.lng, position.lat, position.lng);
          graph = L.circle(mouse_down_point, {
            radius: distance,
            weight: 1,
            color: "black",
            fillColor: "black",
            fillOpacity: 0.1
          }).addTo(self.map);
          break;
        }
        default:
          break;
      }
    }
  }

  function drawHeatMap() {
    var heat_list = [];
    for (var i = 0; i !== stations_info.length; ++i) {
      var heat_station = [stations_info[i].latitude, stations_info[i].longitude, stations_info[i].routes_number];
      heat_list.push(heat_station);
    }
    heat_map = L.heatLayer(heat_list, {
      radius: 15,
      minOpacity: 0.4,
      gradient: {
        '0.1': 'black',
        '0.4': 'blue',
        '0.7': 'orange',
        '1': 'red'
      },
      max: 0
    }).addTo(self.map);
  }

  function removeHeatMap() {
    if (heat_map) {
      self.map.removeLayer(heat_map);
      heat_map = null;
    }
  }

  function clearSSMap() {
    routes_info.forEach(function (d) {
      removeSubRoute(d.sub_route_id);
    });
    stations_info.forEach(function (d) {
      removeStation(d.station_id);
    })
  }

}