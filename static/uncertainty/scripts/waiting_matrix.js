function create_waiting_matrix() {

  var station_date_group = {};

  var width = 1700;

  var height = 970;

  var container = d3.select('#main').append('svg').attr('width', width + 100).attr('height', height);

  var color = d3.scaleLinear()
    .range(["#F1E0B1", "#F26C1A"]);

  var svg = container.append('g')
    .attr('transform', 'translate(100,' + (100) + ')');

  var grid_data = {};

  d3.csv('/static/uncertainty/files/station_run_data2.csv', function (data) {

    data = data.filter(function (d) {

      return d.station_id !== '90050031';
    });

    data.forEach(function (d) {

      d.start_date_time = new Date(d.start_date_time);

      d.end_date_time = new Date(d.end_date_time)
    });

    var station_dict = {};

    data.forEach(function (d) {

      if (station_dict[d.station_id] === undefined) {

        station_dict[d.station_id] = {};
        station_dict[d.station_id]['id'] = d3.keys(station_dict).length;
        station_dict[d.station_id]['name'] = d.station_name;
      }

      var day = d.end_date_time.getDate();

      var hour = d.end_date_time.getHours();


      if (station_date_group[d.station_id] !== undefined) {


        if (station_date_group[d.station_id][day] !== undefined) {

          if (station_date_group[d.station_id][day][hour] !== undefined) {

            station_date_group[d.station_id][day][hour].push(d)
          }
          else {

            station_date_group[d.station_id][day][hour] = [];

            station_date_group[d.station_id][day][hour].push(d)
          }
        }
        else {

          station_date_group[d.station_id][day] = {};

          station_date_group[d.station_id][day][hour] = [];

          station_date_group[d.station_id][day][hour].push(d)
        }
      }
      else {

        station_date_group[d.station_id] = {};

        station_date_group[d.station_id][day] = {};

        station_date_group[d.station_id][day][hour] = [];

        station_date_group[d.station_id][day][hour].push(d)
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

    var mat_data = [];

    for (var i = 7; i < 23; i++) {

      for (station in station_date_group) {

        var all_dur = -1;

        var counter = 0;

        for (day in station_date_group[station]) {

          if (station_date_group[station][day][i] !== undefined) {

            var will = station_date_group[station][day][i][0];

            var dur = will.start_date_time.getHours() * 3600;

            dur += will.start_date_time.getMinutes() * 60;

            dur += will.start_date_time.getSeconds();

            dur -= (i * 3600);

            if (dur < 0 && will.start_date_time.getHours() === i - 1) {

              dur = 0;

              counter += 1;

              if (grid_data[station] !== undefined) {

                if (grid_data[station][i] !== undefined) {

                  grid_data[station][i].push(dur / 60)
                }
                else {

                  grid_data[station][i] = [];
                  grid_data[station][i].push(dur / 60)
                }
              }
              else {

                grid_data[station] = {};
                grid_data[station][i] = [];
                grid_data[station][i].push(dur / 60)
              }

              continue
            }

            else if (dur < 0) {

              dur = -1;

              all_dur = -1
            }


            if (dur >= 0) {

              all_dur += dur;

              counter += 1;

              if (grid_data[station] !== undefined) {

                if (grid_data[station][i] !== undefined) {

                  grid_data[station][i].push(dur / 60)
                }
                else {

                  grid_data[station][i] = [];
                  grid_data[station][i].push(dur / 60)
                }
              }
              else {

                grid_data[station] = {};
                grid_data[station][i] = [];
                grid_data[station][i].push(dur / 60)
              }
            }

          }

        }

        if (all_dur >= 0) {

          all_dur = all_dur / counter;

          mat_data.push([station, i - 3, all_dur])
        }

      }
    }

    var gap = 21;

    var maxv = d3.max(mat_data, function (d) {

      return d[2]
    });
    color.domain([0, maxv]);

    svg.selectAll('grid')
      .data(mat_data)
      .enter()
      .append('rect')
      .attr('x', function (d) {

        return d[1] * gap
      })
      .attr('y', function (d) {

        return station_dict[d[0]]['id'] * gap
      })
      .attr('width', gap - 1)
      .attr('height', gap - 1)
      .attr('fill', function (d) {

        return color(d[2])
      })
      .attr('opacity', function (d) {

        return 0.7
      })
      .on('click', function (d) {


        var destination = '11000021';
        var dest_data = [];

        for (var day in station_date_group[destination]) {

          var hour = d[1];

          var meta = station_date_group[destination][day][hour];

          var source = station_date_group[d[0]][day][hour][0];

          meta.forEach(function (d) {

            if (d.product_id === source.product_id && d.start_date_time > source.start_date_time) {

              dest_data.push(parseInt((d.start_date_time.getTime() - source.end_date_time.getTime()) / 60000))
            }
          })
        }


        var data = grid_data[d[0]][d[1]];

        var total_data = [];

        for (var i = 0; i < dest_data.length; i++) {

          total_data.push(data[i] + dest_data[i])
        }


        $.ajax({
          type: "POST",
          url: "http://localhost:5000/",
          // The key needs to match your method's input parameter (case-sensitive).
          data: JSON.stringify({'data': data}),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function (arg) {

            create_data_dist(data, arg, 'dist1', d[1])

          },
          failure: function (errMsg) {

            alert(errMsg);
          }
        });

        $.ajax({
          type: "POST",
          url: "http://localhost:5000/",
          // The key needs to match your method's input parameter (case-sensitive).
          data: JSON.stringify({'data': dest_data}),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function (arg) {

            create_data_dist(dest_data, arg, 'dist2', d[1])

          },
          failure: function (errMsg) {

            alert(errMsg);
          }
        });

        $.ajax({
          type: "POST",
          url: "http://localhost:5000/",
          // The key needs to match your method's input parameter (case-sensitive).
          data: JSON.stringify({'data': total_data}),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function (arg) {

            create_data_dist(total_data, arg, 'dist3', d[1])

          },
          failure: function (errMsg) {

            alert(errMsg);
          }
        });


      })

      .append('title')
      .text(function (d) {

        return d[2] / 60
      });

    svg.selectAll('station_label')
      .data(d3.keys(station_dict))
      .enter()
      .append('text')
      .attr('x', function (d) {

        return 60
      })
      .attr('y', function (d) {

        return station_dict[d].id * gap + 10
      })
      .attr('font-size', 10)
      .text(function (d) {

        return station_dict[d].name
      })
      .attr('text-anchor', 'end');


    var station_count = {};

    var hour_count = {};

    mat_data.forEach(function (d) {

      if (station_count[d[0]] !== undefined)
        station_count[d[0]] += d[2];
      else
        station_count[d[0]] = d[2];

      if (hour_count[d[1]] !== undefined)
        hour_count[d[1]] += d[2];
      else
        hour_count[d[1]] = d[2]
    });

    var max_station_count = d3.max(d3.values(station_count), function (d) {

      return d
    });

    var max_hour_count = d3.max(d3.values(hour_count), function (d) {

      return d
    });


    svg.selectAll('station_count')
      .data(d3.keys(station_count))
      .enter()
      .append('rect')
      .attr('x', function (d) {

        return (d3.keys(hour_count).length + 4) * gap
      })
      .attr('width', function (d) {

        return (station_count[d] / max_station_count) * 40
      })
      .attr('y', function (d) {

        return station_dict[d].id * gap
      })
      .attr('height', 10)
      .attr('fill', '#9cc')
      .attr('opacity', 0.7);

    svg.selectAll('hour_count')
      .data(d3.keys(hour_count))
      .enter()
      .append('rect')
      .attr('y', function (d) {

        return (d3.keys(station_count).length + 1) * gap
      })
      .attr('height', function (d) {

        return (hour_count[d] / max_hour_count) * 40
      })
      .attr('x', function (d) {

        return d * gap
      })
      .attr('width', 10)
      .attr('fill', '#9cc')
      .attr('opacity', 0.7);

    svg.selectAll('hour_label')
      .data(d3.keys(hour_count))
      .enter()
      .append('text')
      .attr('x', function (d) {

        return d * gap + 5
      })
      .attr('y', function (d) {

        return 5
      })
      .attr('font-size', 10)
      .text(function (d) {

        return d
      })
      .attr('text-anchor', 'middle');

    svg.append("linearGradient")
      .attr("id", 'heat_legend')
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 200).attr("y1", 0)
      .attr("x2", 300).attr("y2", 0)
      .selectAll("stop")
      .data([
        {offset: "0%", color: '#F1E0B1'},
        {offset: "100%", color: '#F26C1A'},
      ])
      .enter().append("stop")
      .attr("offset", function (d) {
        return d.offset;
      })
      .attr("stop-color", function (d) {
        return d.color;
      });

    svg.append('rect')
      .attr('fill', 'url(#heat_legend)')
      .attr('stroke', 'black')
      .attr('x', 200)
      .attr('y', -20)
      .attr('width', 100)
      .attr('height', 10);

    svg.append('text')
      .attr('x', 200)
      .attr('y', -25)
      .attr('font-size', 10)
      .text(0);

    svg.append('text')
      .attr('x', 300)
      .attr('y', -25)
      .attr('font-size', 10)
      .text(parseInt(maxv / 60))
  });

  function create_data_dist(data, arguments, container_name, date) {

    var shape = arguments['shape'];
    var scale = arguments['scale'];

    var worsty = arguments['worsty'];
    var commonly = arguments['commonly'];
    var luckly = arguments['lucky'];

    d3.select('#' + container_name).selectAll('*').remove();

    var width = 350;

    var height = 200;

    var svg = d3.select('#' + container_name).append('svg')
      .attr('class', 'each_card')
      .attr('width', width)
      .attr('height', 800);


    create_clock_graph(date, arguments, container_name);

    create_mentor_graph(data, arguments, svg, container_name);

    create_bar_graph(data, container_name);

    container = svg.append('g')
      .attr('class', 'dist_chart');

    var group_dict = {};

    data.forEach(function (d) {

      if (group_dict[d] !== undefined)
        group_dict[d]++;
      else
        group_dict[d] = [d]
    });

    var dist_data = gamma_generator(d3.keys(group_dict), 1 / scale, shape);

    var max_prop = d3.max(dist_data, function (d) {

      return d[1]
    });


    var group_array = [];

    for (head in group_dict) {

      group_array.push([parseInt(head), group_dict[head]])
    }

    var maxx = d3.max(group_array, function (d) {

      return d[0]
    });

    var minx = d3.min(group_array, function (d) {

      return d[0]
    });

    var maxy = d3.max(group_array, function (d) {

      return d[1]
    });

    var margin = 30;

    var xScale = d3.scaleLinear().range([margin, width - margin]).domain([minx * 0.9, maxx * 1.1]);
    var yScale = d3.scaleLinear().range([margin, height - margin]).domain([maxy, 0]);

    var yScale_prop = d3.scaleLinear().range([margin, height - margin]).domain([max_prop, 0]);

    var chart = d3.box()
      .whiskers(iqr(1.5))
      .height(30)
      .width(width - margin - margin)
      .domain([minx, maxx]);

    container.append("g")
      .datum(data)
      .attr("transform", function (d) {
        return "translate(" + margin + ",220)";
      })
      .call(chart);

    var mean = math.mean(data);

    var max_density = 0;

    var max_density_index = 0;

    dist_data.forEach(function (d) {

      if (d[1] > max_density) {

        max_density = d[1];

        max_density_index = d[0]
      }
    });

    container.append('line')
      .attr('x1', xScale(mean))
      .attr('x2', xScale(mean))
      .attr('y1', height - margin)
      .attr('y2', margin)
      .attr('stroke-dasharray', '4,4')
      .attr('stroke', '#9c9')
      .attr('stroke-width', '3');

    container.append('line')
      .attr('x1', xScale(max_density_index))
      .attr('x2', xScale(max_density_index))
      .attr('y1', height - margin)
      .attr('y2', margin)
      .attr('stroke-dasharray', '4,4')
      .attr('stroke', '#99c')
      .attr('stroke-width', '3');

    container.append('text')
      .attr('x', function (d) {

        if (xScale(max_density_index) > xScale(mean))
          return xScale(max_density_index) + 10;
        else
          return xScale(max_density_index) - 10;
      })
      .attr('y', margin * 4)
      .attr('font-size', 11)
      .attr('text-anchor', function () {

        if (xScale(max_density_index) > xScale(mean))
          return 'start';
        else
          return 'end'
      })
      .text('Max P: ' + parseInt((max_density_index) * 100) / 100);

    container.append('text')
      .attr('x', function (d) {

        if (xScale(max_density_index) < xScale(mean))
          return xScale(mean) + 10;
        else
          return xScale(mean) - 10
      })
      .attr('y', margin * 2)
      .attr('font-size', 11)
      .attr('text-anchor', function () {

        if (xScale(max_density_index) > xScale(mean))
          return 'end';
        else
          return 'start'
      })
      .text('Mean: ' + parseInt(mean * 100) / 100);

    var areaGeneretor = d3.area()
      .curve(d3.curveBasis)
      .x(function (d) {
        return xScale(d[0])
      })
      .y1(function (d) {
        return yScale_prop(d[1])
      })
      .y0(function (d) {
        return height - margin
      });

    container.append("g")
      .attr("transform", "translate(0," + (height - margin) + ")")
      .call(d3.axisBottom(xScale));

    container.append("g")
      .attr("transform", "translate(30,0)")
      .call(d3.axisLeft(yScale).tickFormat(d3.format("d")).ticks(2));

    container.append('path')
      .datum(dist_data)
      .attr('d', areaGeneretor)
      .attr('fill', 'grey')
      .attr('opacity', 0.3)
      .attr('stroke', 'none')

  }
}

create_waiting_matrix();

function gamma_generator(X, beta, alpha) {

  var mode = math.mode(X);

  var ret = [];

  var max = d3.max(X, function (d) {

    return parseInt(d)
  });

  var step = max / 20;

  for (var i = 0; i < max + 100; i += step) {

    var val = gamma_pdf(i, beta, alpha);

    if (val >= 0)
      ret.push([i, val]);
    else
      ret.push([i, 0])
  }

  console.log(ret, X, beta, alpha);

  return ret
}

function gamma_pdf(x, beta, alpha) {

  var gamma = 1;

  for (var i = alpha - 1; i > 0; i--) {
    gamma = gamma * i;
  }

  numerator = Math.pow(beta, alpha) * Math.pow(x, alpha - 1) * Math.exp(-beta * x);
  denominator = gamma;

  if (numerator / denominator === Infinity)
    return -1
  else
    return numerator / denominator;

}

function iqr(k) {
  return function (d, i) {
    var q1 = d.quartiles[0],
      q3 = d.quartiles[2],
      iqr = (q3 - q1) * k,
      i = -1,
      j = d.length;
    while (d[++i] < q1 - iqr) ;
    while (d[--j] > q3 + iqr) ;
    return [i, j];
  };
}

function create_mentor_graph(data, args, svg, divname) {

  var container = svg.append('g')
    .attr('transform', 'translate(0,540)')

  d3.xml("svgs/knees.svg").mimeType("image/svg+xml").get(function (error, xml) {
    if (error) throw error;

    var importedNode = document.importNode(xml.documentElement, true);

    d3.select('#' + divname).selectAll('.each_card')
      .each(function () {

        var node = this.appendChild(importedNode);

        d3.select(node)
          .attr('width', 25)
          .attr('id', 'knees')
          .attr('height', 25)
          .attr('x', '50px')
          .attr('y', '550px')

        //  d3.select(node).selectAll('*').attr('fill','#c66').style('fill','#c66')
      })


    d3.xml("svgs/running.svg").mimeType("image/svg+xml").get(function (error, xml) {
      if (error) throw error;

      var importedNode = document.importNode(xml.documentElement, true);

      d3.select('#' + divname).selectAll('.each_card')
        .each(function () {
          var node = this.appendChild(importedNode);

          d3.select(node)
            .attr('id', 'runing')
            .attr('width', 25)
            .attr('height', 25)
            .attr('x', '100px')
            .attr('y', '550px')

          // d3.select(node).selectAll('*').attr('fill','#f93').style('fill','#f93')
        })

      d3.xml("svgs/walking.svg").mimeType("image/svg+xml").get(function (error, xml) {
        if (error) throw error;

        var importedNode = document.importNode(xml.documentElement, true);

        d3.select('#' + divname).selectAll('.each_card')
          .each(function () {

            var node = this.appendChild(importedNode);

            d3.select(node)
              .attr('id', 'walking')
              .attr('width', 25)
              .attr('height', 25)
              .attr('x', '200px')
              .attr('y', '550px')

            //  d3.select(node).selectAll('*').attr('fill','#993').style('fill','#993')
          })

        d3.xml("svgs/coffee.svg").mimeType("image/svg+xml").get(function (error, xml) {
          if (error) throw error;

          var importedNode = document.importNode(xml.documentElement, true);

          d3.select('#' + divname).selectAll('.each_card')
            .each(function () {

              var node = this.appendChild(importedNode);

              d3.select(node)
                .attr('id', 'coffee')
                .attr('width', 25)
                .attr('height', 25)
                .attr('x', '250px')
                .attr('y', '550px')

              // d3.select(node).selectAll('*').attr('fill','#3c9').style('fill','#3c9')
            })


          var status = [args['min'], args['lucky'], args['commonly'], args['worsty']]

          var c_p = [0, 3, 5, 10]

          var min = c_p[0]

          var max = c_p[3]

          var width = 250

          var status_data = [[c_p[3], c_p[2]], [c_p[2], c_p[1]], [c_p[1], c_p[0]], [c_p[0], c_p[0]]]

          var mentor_array = ['coffee', 'walking', 'runing', 'knees']

          container.selectAll('statu_bar')
            .data(status_data)
            .enter()
            .append('line')
            .attr('stroke', '#333')
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .attr('height', 25)
            .attr('x1', 50)
            .attr('x2', 300)
            .attr('y1', 40)
            .attr('y2', 40)

          container.selectAll('statu_bar')
            .data(status_data)
            .enter()
            .append('line')
            .attr('stroke', '#333')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('height', 25)
            .attr('x1', 50)
            .attr('x2', 300)
            .attr('y1', 65)
            .attr('y2', 65)


          container.selectAll('statu_bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('stroke', function (d) {

              if (d < status[0] || d > status[3])
                return '#c33'
              else
                return '#333'
            })
            .attr('fill', 'none')
            .attr('height', 25)
            .attr('x', function (d, i) {

              return (d - status[0]) / (status[3] - status[0]) * width + 50
            })
            .attr('width', 1)
            .attr('opacity', 0.3)
            .attr('y', 40)


          container.selectAll('statu_text')
            .data(c_p)
            .enter()
            .append('text')
            .attr('x', function (d, i) {

              d3.select('#' + divname).select('#' + mentor_array[i]).attr('x', ((d - min) / (max - min) * width + 40) + 'px')

              return (d - min) / (max - min) * width + 50
            })
            .attr('y', 80)
            .attr('text-anchor', 'middle')
            .text(function (d, i) {
              return status[i]
            })

        });

      });


    });


  });


}

function create_clock_graph(date, args, container_name) {

  container = d3.select('#' + container_name).select('svg').append('g')
    .attr('transform', 'translate(125,440)')

  container.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', 80)
    .attr('stroke', '#333')
    .attr('stroke-width', '3')
    .attr('fill', 'none')

  container.append('text')
    .attr('x', '-100')
    .attr('y', '-140')
    .attr('font-size', 12)
    .text('If you are in station at ' + date + ':00 ')

  var text = 'You will arrive at:'

  if (container_name == 'dist1')
    text = 'You will waiting bus for:'
  else if (container_name == 'dist2')
    text = 'You will cost time in trip:'

  container.append('text')
    .attr('font-size', 12)
    .attr('x', '-100')
    .attr('y', '-120')
    .text(text)

  var arc = d3.arc()
    .outerRadius(80)
    .innerRadius(0);

  var labelData = []

  var wortyData = args['worsty']

  wortyData = wortyData / 60 * 2 * Math.PI;

  var commonlyData = args['commonly']

  commonlyData = commonlyData / 60 * 2 * Math.PI;

  var luckyData = args['lucky']

  var min = args['min'] / 60 * 2 * Math.PI;

  luckyData = luckyData / 60 * 2 * Math.PI;

  labelData.push({'startAngle': min, 'endAngle': luckyData})

  labelData.push({'startAngle': luckyData, 'endAngle': commonlyData})

  labelData.push({'startAngle': commonlyData, 'endAngle': wortyData})

  var innerRadius = 80

  container.append("defs").selectAll("linearGradient")
    .data([{'startAngle': min, 'endAngle': commonlyData}, {'startAngle': wortyData, 'endAngle': commonlyData}])
    .enter().append("linearGradient")
    .attr("id", function (d) {
      return d.startAngle + '&' + d.endAngle
    })
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", function (d, i) {
      return innerRadius * Math.cos(d.startAngle - Math.PI / 2);
    })
    .attr("y1", function (d, i) {
      return innerRadius * Math.sin(d.startAngle - Math.PI / 2);
    })
    .attr("x2", function (d, i) {
      return innerRadius * Math.cos(d.endAngle - Math.PI / 2);
    })
    .attr("y2", function (d, i) {
      return innerRadius * Math.sin(d.endAngle - Math.PI / 2);
    })
    .selectAll("stop")
    .data([
      {offset: "0%", color: '#fff'},
      {offset: "100%", color: '#000'},
    ])
    .enter().append("stop")
    .attr("offset", function (d) {
      return d.offset;
    })
    .attr("stop-color", function (d) {
      return d.color
    })

  container.append("defs")
    .append("linearGradient")
    .attr("id", 'density')
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", innerRadius + 50)
    .attr("y1", -innerRadius)
    .attr("x2", innerRadius + 50)
    .attr("y2", innerRadius)
    .selectAll("stop")
    .data([
      {offset: "0%", color: '#fff'},
      {offset: "100%", color: '#000'},
    ])
    .enter().append("stop")
    .attr("offset", function (d) {
      return d.offset;
    })
    .attr("stop-color", function (d) {
      return d.color
    })


  container.selectAll(".arc")
    .data([{'startAngle': min, 'endAngle': commonlyData}, {'startAngle': wortyData, 'endAngle': commonlyData}])
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', function (d) {
      return 'url(#' + d.startAngle + '&' + d.endAngle + ')'
    })
    .attr('fill-opacity', 0.5)
    .attr('stroke', 'none')

  container.append('rect')
    .attr('x', innerRadius + 50)
    .attr('y', -innerRadius)
    .attr('width', 15)
    .attr('height', innerRadius * 2)
    .attr('fill', 'url(#density)')

  container.append('text')
    .attr('x', innerRadius + 50)
    .attr('y', -innerRadius - 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', 11)
    .text('Lowly Possible')

  container.append('text')
    .attr('x', innerRadius + 50)
    .attr('y', innerRadius + 20)
    .attr('font-size', 11)
    .attr('text-anchor', 'middle')
    .text('Highly Possible')

  var ticks = [min, wortyData]

  container.selectAll('indicate_line')
    .data(ticks)
    .enter()
    .append('text')
    .attr('x', function (d) {

      var base = innerRadius * Math.cos(d - Math.PI / 2);

      if (base > 1) {

        return base += 5
      }
      else if (base < -1) {

        return base -= 5
      }

      return base
    })
    .attr('y', function (d) {

      var base = innerRadius * Math.sin(d - Math.PI / 2);

      if (base > 1) {

        return base += 10
      }
      else if (base < -1) {

        return base -= 10
      }

      return base
    })
    .attr('text-anchor', function (d) {

      var base = innerRadius * Math.cos(d - Math.PI / 2);

      if (base > 1) {

        return 'start'
      }
      else if (base < -1) {

        return 'end'
      }

      return 'middle'

    })
    .text(function (d) {

      return parseInt(d * 60 / 2 / Math.PI)
    })

}

function create_bar_graph(data, container_name) {

  var container = d3.select('#' + container_name).select('svg').append('g')
    .attr('transform', 'translate(0,670)')

  var max = d3.max(data, function (d) {

    return d
  })

  var min = d3.min(data, function (d) {

    return d
  })

  container.append('line')
    .attr('x1', 50)
    .attr('x2', 300)
    .attr('y1', 10)
    .attr('y2', 10)
    .attr('stroke', '#999')

  container.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', function (d) {

      return (d - min) / (max - min) * 250 + 50
    })
    .attr('y', 0)
    .attr('width', 1)
    .attr('height', 20)

  container.append('text')
    .attr('x', 40)
    .attr('y', 15)
    .attr('fill', '#333')
    .attr('font-size', 11)
    .attr('text-anchor', 'end')
    .text(parseInt(min))

  container.append('text')
    .attr('x', 310)
    .attr('y', 15)
    .attr('fill', '#333')
    .attr('font-size', 11)
    .text(parseInt(max))

  var tick_data = []

  var step = (max - min) / 5

  for (var i = min + 1; i < max; i += step) {

    tick_data.push(parseInt(i))
  }

  container.selectAll('.ticks')
    .data(tick_data)
    .enter()
    .append('line')
    .attr('stroke', '#c33')
    .attr('stroke-dasharray', '4,4')
    .attr('x1', function (d) {

      return (d - min) / (max - min) * 250 + 50
    })
    .attr('x2', function (d) {

      return (d - min) / (max - min) * 250 + 50
    })
    .attr('y1', 10)
    .attr('y2', 30)

  container.selectAll('.ticks_label')
    .data(tick_data)
    .enter()
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('font-size', 10)
    .attr('x', function (d) {

      return (d - min) / (max - min) * 250 + 50
    })
    .attr('y', 40)
    .text(function (d) {

      return d
    })
}