function create_co_vis() {

  var colors = d3.scaleOrdinal(d3.schemeDark2);

  d3.csv('/static/uncertainty/files/station_check_data2.csv', function (data) {

    var width = 1600;

    var height = 970;

    var route_dict = {};

    var hour_count_dict = {};

    var hour_count_max = 0;

    var day_count_max = 0;

    var route_count_max = 0;

    var co_count_max = 0;

    var day_count_dict = {};

    var route_count_dict = {};

    var route_co_dict = {};

    var co_pair = {};

    var container = d3.select('#main').append('svg').attr('width', width + 300).attr('height', height);

    var tScale = d3.scaleTime()
      .domain([23200, 86400])
      .range([0, width - 100]);

    data.forEach(function (d) {

      d.start_date_time = new Date(d.start_date_time);

      d.end_date_time = new Date(d.end_date_time);

      if (route_dict[d.route_id] === undefined)
        route_dict[d.route_id] = d3.keys(route_dict).length;
      if (hour_count_dict[d.start_date_time.getHours()] !== undefined) {
        hour_count_dict[d.start_date_time.getHours()] += 1;
      }
      else {

        hour_count_dict[d.start_date_time.getHours()] = 1;
      }

      if (day_count_dict[d.start_date_time.getDate()] !== undefined) {
        day_count_dict[d.start_date_time.getDate()] += 1;
      }
      else {

        day_count_dict[d.start_date_time.getDate()] = 1
      }

      if (route_count_dict[d.route_id] !== undefined) {
        route_count_dict[d.route_id] += 1;
      }
      else {

        route_count_dict[d.route_id] = 1;
      }

    });

    hour_count_max = d3.max(d3.values(hour_count_dict), function (d) {

      return d
    });

    day_count_max = d3.max(d3.values(day_count_dict), function (d) {

      return d
    });

    route_count_max = d3.max(d3.values(route_count_dict), function (d) {

      return d
    });

    var co_array = [];

    data = data.sort(function (a, b) {

      return a.start_date_time.getTime() - b.start_date_time.getTime()
    });

    for (var i = 0; i < data.length - 1; i++) {

      var j = i + 1;

      var a = data[i].start_date_time.getTime();

      var b = data[j].start_date_time.getTime();

      var id_1 = data[i].route_id;

      var id_2 = data[j].route_id;

      if (data[i].route_id > data[j].route_id) {

        id_1 = data[j].route_id;
        id_2 = data[i].route_id;
      }

      var pair = id_1 + '&' + id_2;


      if (b - a < 1000) {

        co_array.push([data[i], data[j]]);

        if (route_co_dict[data[i].route_id] !== undefined) {
          route_co_dict[data[i].route_id] += 1
        }
        else {

          route_co_dict[data[i].route_id] = 1

        }
        if (route_co_dict[data[j].route_id] !== undefined) {
          route_co_dict[data[j].route_id] += 1
        }
        else {

          route_co_dict[data[j].route_id] = 1
        }

        if (co_pair[pair] !== undefined) {
          co_pair[pair] += 1
        }
        else {

          co_pair[pair] = 1
        }

      }
    }

    co_count_max = d3.max(d3.values(route_co_dict), function (d) {

      return d
    });


    var svg = container.append('g')
      .attr('transform', 'translate(100,' + (20) + ')');
    svg.selectAll('.co_line')
      .data(co_array)
      .enter()
      .append('circle')
      .attr('class', 'co_bar')
      .attr('r', 5)
      .attr('cy', function (d) {

        return d[0].start_date_time.getDate() * 20
      })
      .attr('cx', function (d) {

        var val = d[0].start_date_time.getHours() * 3600 + d[0].start_date_time.getMinutes() * 60 + d[0].start_date_time.getSeconds()

        return tScale(val) + 5
      })
      .attr('fill', function (d) {

        return colors(d[0].route_id)
      })
      .attr('opacity', 0.5);


    svg.selectAll('.co_line')
      .data(co_array)
      .enter()
      .append('circle')
      .attr('class', 'co_bar')
      .attr('r', 5)
      .attr('cy', function (d) {

        return d[1].start_date_time.getDate() * 20
      })
      .attr('cx', function (d) {

        var val = d[1].start_date_time.getHours() * 3600 + d[1].start_date_time.getMinutes() * 60 + d[1].start_date_time.getSeconds()

        return tScale(val) - 5
      })
      .attr('fill', function (d) {

        return colors(d[1].route_id)
      })
      .attr('opacity', 0.5);


    svg.selectAll('.co_line')
      .data(d3.keys(hour_count_dict))
      .enter()
      .append('rect')
      .attr('width', 10)
      .attr('height', function (d) {

        return hour_count_dict[d] / hour_count_max * 50
      })
      .attr('y', function (d) {

        return d3.keys(day_count_dict).length * 21
      })
      .attr('x', function (d) {

        return tScale(d * 3600)
      })
      .attr('fill', function (d) {

        return 'black'
      })
      .attr('opacity', 0.7);


    svg.selectAll('.co_line')
      .data(d3.keys(day_count_dict))
      .enter()
      .append('rect')
      .attr('height', 10)
      .attr('width', function (d) {

        return day_count_dict[d] / day_count_max * 50
      })
      .attr('y', function (d) {

        return d * 20
      })
      .attr('x', function (d) {

        return width - 150
      })
      .attr('fill', function (d) {

        return 'black'
      })
      .attr('opacity', 0.7);

    svg.selectAll('.co_line')
      .data(d3.keys(route_co_dict))
      .enter()
      .append('rect')
      .attr('height', function (d) {

        return route_co_dict[d] / route_count_dict[d] * 3000
      })
      .attr('width', function (d) {

        return 20
      })
      .attr('y', function (d) {

        return d3.keys(day_count_dict).length * 26
      })
      .attr('x', function (d, i) {

        return i * 80 + 100
      })
      .attr('fill', function (d) {

        return colors(d)
      })
      .attr('opacity', function (d) {

        return 1
      })
      .on('click', function (d) {

        svg.selectAll('.co_bar')
          .attr('opacity', function (q) {

            if (q[0].route_id === d || q[1].route_id === d)
              return 0.5;
            else return 0;
          })

      });

    svg.selectAll('.co_line')
      .data(d3.keys(co_pair))
      .enter()
      .append('rect')
      .attr('height', function (d) {

        return 10
      })
      .attr('width', function (d) {

        return co_pair[d]
      })
      .attr('y', function (d, i) {

        return i * 11
      })
      .attr('x', function (d, i) {

        return width - 90
      })
      .attr('fill', function (d) {

        return 'black'
      })
      .attr('opacity', function (d) {

        return 0.3
      });

    svg.selectAll('.co_label')
      .data(d3.keys(co_pair))
      .enter()
      .append('text')
      .attr('y', function (d, i) {

        return i * 11
      })
      .attr('x', function (d, i) {

        return width - 30
      })
      .text(function (d) {

        return d
      });

    svg.selectAll('.co_line')
      .data(d3.keys(route_co_dict))
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', function (d) {

        return d3.keys(day_count_dict).length * 25
      })
      .attr('x', function (d, i) {

        return i * 80 + 110
      })
      .text(function (d) {

        return d
      });

    svg.selectAll('.co_line')
      .data(d3.keys(route_co_dict))
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', function (d) {

        return d3.keys(day_count_dict).length * 25 + route_co_dict[d] / route_count_dict[d] * 3000 + 50
      })
      .attr('x', function (d, i) {

        return i * 80 + 110
      })
      .text(function (d) {

        return route_co_dict[d] + '-' + route_count_dict[d]
      })


  })
}

create_co_vis();