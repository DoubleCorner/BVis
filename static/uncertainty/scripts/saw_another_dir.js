function create_saw_another_dir() {

  var station_date_group = {};

  var width = 1700;

  var height = 970;

  var container = d3.select('#main').append('svg').attr('width', width + 100).attr('height', height);

  var color = d3.scaleLinear()
    .range(["#00A388", "#FF6138"]);

  var svg = container.append('g')
    .attr('transform', 'translate(100,' + (100) + ')');

  d3.csv('/static/uncertainty/files/station_run_data2.csv', function (data) {

    data.forEach(function (d) {

      d.start_date_time = new Date(d.start_date_time);

      d.end_date_time = new Date(d.end_date_time)
    });

    var station_dict = {};

    data.forEach(function (d) {

      if (station_dict[d.station_name] === undefined) {

        station_dict[d.station_name] = {};
        station_dict[d.station_name]['id'] = d3.keys(station_dict).length;
        station_dict[d.station_name]['name'] = d.station_name
      }

      var day = d.end_date_time.getDate();

      var hour = d.end_date_time.getHours();

      if (station_date_group[d.station_name] !== undefined) {


        if (station_date_group[d.station_name][day] !== undefined) {

          if (station_date_group[d.station_name][day][hour] !== undefined) {

            station_date_group[d.station_name][day][hour].push(d)
          }
          else {

            station_date_group[d.station_name][day][hour] = [];

            station_date_group[d.station_name][day][hour].push(d)
          }
        }
        else {

          station_date_group[d.station_name][day] = {};

          station_date_group[d.station_name][day][hour] = [];

          station_date_group[d.station_name][day][hour].push(d);
        }
      }
      else {

        station_date_group[d.station_name] = {};

        station_date_group[d.station_name][day] = {};

        station_date_group[d.station_name][day][hour] = [];

        station_date_group[d.station_name][day][hour].push(d);
      }
    });

    for (station in station_date_group) {

      for (day in station_date_group[station]) {

        for (hour in station_date_group[station][day]) {

          station_date_group[station][day][hour] = station_date_group[station][day][hour].sort(function (a, b) {

            return a.start_date_time - b.end_date_time
          })

        }
      }

    }

    var saw_another_array = [];

    var non_saw_array = [];

    for (var i = 7; i < 23; i++) {

      for (station in station_date_group) {

        for (day in station_date_group[station]) {

          if (station_date_group[station][day][i] !== undefined && station_date_group[station][day][i].length > 1) {

            var will = station_date_group[station][day][i][0];

            var next = station_date_group[station][day][i][1];

            var my_side_station_id = will.station_id;

            var other_side_station_id = next.station_id;

            // console.log(my_side_station_id, other_side_station_id)

            if (my_side_station_id[my_side_station_id.length - 1] === '2' || my_side_station_id[my_side_station_id.length - 1] === '3') {

              var meta = [will, i];

              non_saw_array.push(meta);
            }

            else if (other_side_station_id[other_side_station_id.length - 1] === '2' || other_side_station_id[other_side_station_id.length - 1] === '3') {

              if (my_side_station_id !== other_side_station_id) {

                if (next.start_date_time.getTime() - will.start_date_time.getTime() < 60000) {

                  meta = [will, next, i];

                  saw_another_array.push(meta)
                }
                else {

                  meta = [next, i];

                  non_saw_array.push(meta)
                }

              }

            }

          }

        }

      }
    }


    svg.selectAll('my_side')
      .data(saw_another_array)
      .enter()
      .append('rect')
      .attr('x', function (d) {

        var p = d[0];

        return ((p.start_date_time.getHours() - 6) * 3600 + (p.start_date_time.getMinutes() * 60 + p.start_date_time.getSeconds())) / 50
      })
      .attr('y', function (d) {

        var p = d[0];

        return station_dict[p.station_name].id * 30
      })
      .attr('fill', '#c33')
      .attr('width', 1)
      .attr('height', 5);


    svg.selectAll('time_line')
      .data(saw_another_array)
      .enter()
      .append('rect')
      .attr('x', function (d) {

        var p = d[2];

        return ((p - 6) * 3600) / 50
      })
      .attr('fill', '#ccc')
      .attr('y', function (d) {

        return 0
      })
      .attr('width', 2)
      .attr('height', d3.keys(station_dict).length * 30);


    non_saw_dict = {};

    non_saw_array.forEach(function (d) {

      if (non_saw_dict[d[1]] !== undefined) {

        if (non_saw_dict[d[1]][d[0].station_name] !== undefined) {

          non_saw_dict[d[1]][d[0].station_name] += 1
        }
        else
          non_saw_dict[d[1]][d[0].station_name] = 1
      }
      else {

        non_saw_dict[d[1]] = {};

        non_saw_dict[d[1]][d[0].station_name] = 1
      }
    });

    non_saw_array = [];

    for (hour in non_saw_dict) {

      for (station in non_saw_dict[hour]) {

        non_saw_array.push([parseInt(hour), station, non_saw_dict[hour][station]])
      }
    }

    svg.selectAll('non_circle')
      .data(non_saw_array)
      .enter()
      .append('circle')
      .attr('cx', function (d) {

        return (d[0] - 6) * 3600 / 50 + 1
      })
      .attr('fill', '#999')
      .attr('cy', function (d) {

        return station_dict[d[1]].id * 30 - 10
      })
      .attr('r', function (d) {

        return d[2] / 4
      });

    svg.selectAll('station_label')
      .data(d3.keys(station_dict))
      .enter()
      .append('text')
      .attr('x', function (d) {

        return 60
      })
      .attr('y', function (d) {

        return station_dict[d].id * 30 + 5
      })
      .attr('font-size', 10)
      .text(function (d) {

        return station_dict[d].name
      })
      .attr('text-anchor', 'end');
  })
}

create_saw_another_dir();