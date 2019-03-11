function create_travel_time() {

  var product_group = {};

  var pair_time_dict = {};

  var station_dict = {};

  var width = 1600;

  var height = 970;

  var go_beginer = '10050032';

  var back_beginer = '11000021';

  var back_ender = '10050074';

  var go_line_dict = {};

  var back_line_dict = {};

  var container = d3.select('#main').append('svg').attr('width', width + 300).attr('height', height);

  var section_cost_dict = {};

  d3.json('/static/uncertainty/files/section.json', function (section) {

    section.forEach(function (sec) {

      var pair = sec.from_id + '&' + sec.target_id;

      section_cost_dict[pair] = sec.distance / 13

    });

    d3.csv('/static/uncertainty/files/station_run_data2.csv', function (data) {

      data.forEach(function (d) {

        d.start_date_time = new Date(d.start_date_time);

        d.end_date_time = new Date(d.end_date_time);

        if (product_group[d.product_id] !== undefined) {

          product_group[d.product_id].push(d)
        }
        else {

          product_group[d.product_id] = [];
          product_group[d.product_id].push(d);
        }

        if (station_dict[d.station_id] === undefined) {

          station_dict[d.station_id] = {};
          station_dict[d.station_id]['id'] = d3.keys(station_dict).length;
          station_dict[d.station_id]['name'] = d.station_name;
        }

      });

      var go_line = [];

      var back_line = [];

      var oneline = [];

      for (car in product_group) {

        product_group[car] = product_group[car].sort(function (a, b) {

          return a.start_date_time - b.start_date_time
        })

      }

      product_group['2065'].forEach(function (d) {

        if (d.start_date_time.getDate() === 1) {

          oneline.push(d.station_id)
        }
      });


      go_line = oneline.slice(oneline.indexOf(go_beginer), oneline.indexOf(back_beginer));

      back_line = oneline.slice(oneline.indexOf(back_beginer), oneline.indexOf(back_ender));

      go_line.forEach(function (d) {

        go_line_dict[d] = d3.keys(go_line_dict).length
      });

      back_line.forEach(function (d) {

        back_line_dict[d] = d3.keys(back_line_dict).length
      });


      for (car in product_group) {

        for (i = 0; i < product_group[car].length - 1; i++) {

          for (j = i + 1; j < product_group[car].length - 1; j++) {

            if (j - i > 20)
              break;

            var a = product_group[car][i];
            var b = product_group[car][j];

            var gap = station_dict[b.station_id].id - station_dict[a.station_id].id;

            if (gap < 0) {

              continue
            }

            var dur = (b.end_date_time.getTime() - a.start_date_time.getTime()) / 1000;

            var pair = a.station_id + '&' + b.station_id;

            if (dur < (gap) * 600 && dur > (gap) * 60) {

              var source = a.station_id;
              var target = b.station_id;

              if (pair_time_dict[source] !== undefined) {

                if (pair_time_dict[source][target] !== undefined) {

                  pair_time_dict[source][target].push((dur / 60))
                }
                else {

                  pair_time_dict[source][target] = [];
                  pair_time_dict[source][target].push((dur / 60))
                }
              }
              else {

                pair_time_dict[source] = {};
                pair_time_dict[source][target] = [];
                pair_time_dict[source][target].push((dur / 60))
              }
            }

          }

        }
      }

      grid_data = [];

      for (i = 0; i < go_line.length; i++) {

        for (j = i + 1; j < go_line.length; j++) {

          values = pair_time_dict[go_line[i]][go_line[j]];

          if (values !== undefined)
            grid_data.push([go_line[i], go_line[j], values])
        }
      }

      container
        .selectAll('.grid')
        .data(grid_data)
        .enter()
        .append('rect')
        .attr('x', function (d) {

          return go_line_dict[d[0]] * 20 + 300
        })
        .attr('y', function (d) {

          return go_line_dict[d[1]] * 20 + 100
        })
        .attr('width', 19)
        .attr('height', 19)
        .attr('fill', 'black')
        .attr('opacity', function (d) {

          return math.mean(d[2]) / 50
        })
        .on('mouseover', function (d) {

          var xPosition = parseFloat(d3.select(this).attr("x")) + $('#tooltip').width() + 200;
          var yPosition = parseFloat(d3.select(this).attr("y")) + $('#tooltip').height() / 2;

          d3.select("#tooltip")
            .style("left", xPosition + "px")
            .style("top", yPosition + "px");

          d3.select("#tooltip").classed("hidden", false);

          create_data_dist(d[2])
        })
        .on('mouseout', function (d) {

          d3.select("#tooltip").classed("hidden", true);
        });

      container.selectAll('station_label')
        .data(go_line)
        .enter()
        .append('text')
        .attr('x', function (d) {

          return 280
        })
        .attr('y', function (d) {

          return go_line_dict[d] * 20 + 115
        })
        .attr('text-anchor', 'end')
        .text(function (d) {

          return station_dict[d]['name']
        });


      container.selectAll('station_label')
        .data(go_line)
        .enter()
        .append('g')
        .attr('transform', function (d) {

          return 'translate(' + (315 + go_line_dict[d] * 20) + ',' + (d3.keys(go_line_dict).length * 20 + 120) + ')'
        })
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', function (d) {

          return 0
        })
        .attr('y', function (d) {

          return 0
        })
        .attr('text-anchor', 'end')
        .text(function (d) {

          return station_dict[d]['name']
        });

      var grid_data = [];

      for (var i = 0; i < back_line.length; i++) {

        for (var j = i + 1; j < back_line.length; j++) {

          var values = pair_time_dict[back_line[i]][back_line[j]];


          grid_data.push([back_line[i], back_line[j], values])
        }
      }


      container.selectAll('.grid')
        .data(grid_data)
        .enter()
        .append('rect')
        .attr('x', function (d) {

          return back_line_dict[d[0]] * 20 + 1000
        })
        .attr('y', function (d) {

          return back_line_dict[d[1]] * 20 + 100
        })
        .attr('width', 19)
        .attr('height', 19)
        .attr('fill', 'black')
        .attr('opacity', function (d) {

          var mean = math.mean(d[2]);

          return mean / 50
        })
        .on('mouseover', function (d) {

          var xPosition = parseFloat(d3.select(this).attr("x")) + $('#tooltip').width() + 200;
          var yPosition = parseFloat(d3.select(this).attr("y")) + $('#tooltip').height() / 2;

          d3.select("#tooltip")
            .style("left", xPosition + "px")
            .style("top", yPosition + "px");

          d3.select("#tooltip").classed("hidden", false);

          create_data_dist(d[2])
        })
        .on('mouseout', function (d) {

          d3.select("#tooltip").classed("hidden", true);
        });


      container.selectAll('station_label')
        .data(back_line)
        .enter()
        .append('text')
        .attr('x', function (d) {

          return 980
        })
        .attr('y', function (d) {

          return back_line_dict[d] * 20 + 115
        })
        .attr('text-anchor', 'end')
        .text(function (d) {

          return station_dict[d]['name']
        });


      container.selectAll('station_label')
        .data(back_line)
        .enter()
        .append('g')
        .attr('transform', function (d) {

          return 'translate(' + (1015 + back_line_dict[d] * 20) + ',' + (d3.keys(back_line_dict).length * 20 + 120) + ')'
        })
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', function (d) {

          return 0
        })
        .attr('y', function (d) {

          return 0
        })
        .attr('text-anchor', 'end')
        .text(function (d) {

          return station_dict[d]['name']
        })

    })

  })
}

create_travel_time();

function gamma_generator(X, beta, alpha) {

  var ret = [];

  var max = d3.max(X, function (d) {

    return parseFloat(d)
  });


  var step = max / 20;

  for (var i = 0.001; i < max; i += step) {

    var val = gamma_pdf(i, beta, alpha);

    if (val !== -1)
      ret.push([i, val])
  }

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
    return -1;
  else
    return numerator / denominator;

}

function calculateGammaParams(data) {

  var mean = math.mean(data);

  var std = math.std(data);

  var shape = (mean / std) * (mean / std);

  var scale = (std * std) / mean;

  return [1 / scale, shape]
}

function create_data_dist(data, x, y) {

  d3.select('#tooltip').remove();

  var width = $('#tooltip').width();

  var height = $('#tooltip').height();

  var svg = d3.select('#tooltip').append('svg')
    .attr('width', width)
    .attr('height', height);


  var container = svg.append('g')
    .attr('class', 'dist_chart');

  width = 300;

  height = 200;

  container = d3.select('#main').append('tooltip').append('svg').attr('class', 'dist_chart').attr('width', width).attr('height', height);

  var group_dict = {};

  data.forEach(function (d) {

    if (group_dict[d] !== undefined)
      group_dict[d]++;
    else
      group_dict[d] = 1;
  });

  var args = calculateGammaParams(data);

  var dist_data = gamma_generator(d3.keys(group_dict), args[0], args[1]);

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
  var maxy = d3.max(group_array, function (d) {

    return d[1]
  });

  var margin = 30;

  var xScale = d3.scaleLinear().range([margin, width - margin]).domain([0, maxx]);
  var yScale = d3.scaleLinear().range([margin, height - margin]).domain([maxy, 0]);

  var yScale_prop = d3.scaleLinear().range([margin, height - margin]).domain([max_prop, 0]);

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
    .call(d3.axisLeft(yScale).ticks(5));

  container.append('path')
    .datum(dist_data)
    .attr('d', areaGeneretor)
    .attr('fill', 'grey')
    .attr('opacity', 0.3)
    .attr('stroke', 'none');

  meanp = d3.mean(data);

  max_num = 0;
  maxp = 0;
  for (h in group_dict) {
    if (group_dict[h] >= max_num) {
      max_num = parseInt(group_dict[h]);
      maxp = parseInt(h);
    }
  }
  p = [maxp, meanp];


  color = ['steelblue', 'green'];


  for (h in p) {
    container.append('g')
      .append('line')
      .attr('x1', xScale(p[h]))
      .attr('x2', xScale(p[h]))
      .attr('y1', yScale(0))
      .attr('y2', yScale(maxy))
      .attr('stroke', color[h])
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-width', '3')
  }


  container.append('g')
    .attr('transform', 'translate(' + xScale(p[h] * 1.2) + ',' + yScale(maxy * 0.5) + ')')
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('font-size', '10px')
    .text('Mean P:' + p[0].toFixed(1));

  container.append('g')
    .attr('transform', 'translate(' + xScale(p[h] * 0.5) + ',' + yScale(maxy * 0.5) + ')')
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('font-size', '10px')
    .text('Max P:' + p[1].toFixed(1))
}
