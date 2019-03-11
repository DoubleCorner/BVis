var station_info = {}

var go_beginer = '10010012'

var back_beginer = '11090014'

var back_ender = '10050074'

function create_yolk_plot() {

  var product_group = {}

  var width = 1900

  var height = 1300

  var container = d3.select('#main').append('svg').attr('width', width).attr('height', height + 100)

  var color = d3.scaleLinear()
    .range(["#F1E0B1", "#F26C1A"]);


  d3.csv('/static/uncertainty/files/station_run_data3.csv', function (data) {

    data = data.filter(function (d) {

      return d.station_id != '90050031'
    })

    data.forEach(function (d) {

      d.start_date_time = new Date(d.start_date_time)

      d.end_date_time = new Date(d.end_date_time)
    })

    var station_dict = {}

    data.forEach(function (d) {

      station_info[d.station_id] = d.station_name;

      if (station_dict[d.station_id] == undefined) {

        station_dict[d.station_id] = {}
        station_dict[d.station_id]['id'] = d3.keys(station_dict).length
        station_dict[d.station_id]['name'] = d.station_name
      }

      var day = d.end_date_time.getDate()

      var hour = d.end_date_time.getHours()

      if (product_group[d.product_id] != undefined) {

        product_group[d.product_id].push(d)
      }
      else {

        product_group[d.product_id] = []
        product_group[d.product_id].push(d)
      }


    })

    for (product in product_group) {

      product_group[product] = product_group[product].sort(function (a, b) {

        return a.start_date_time - b.start_date_time
      })
    }

    var chain_array = []

    for (product in product_group) {

      var newChain = undefined

      var records = product_group[product]

      records.forEach(function (d) {

        if (d.station_id == go_beginer) {

          newChain = new LinkedList()

          newChain.append(d)
        }

        else if (d.station_id == back_beginer) {

          if (newChain != undefined) {

            newChain.append(d)

            if (newChain.getLength() >= 0) {

              chain_array.push(newChain)

              newChain = undefined

            }

          }
        }

        else {

          if (newChain != undefined) {

            newChain.append(d)
          }
        }
      })
    }

    create_node_chain(container, chain_array)

  })

}

function create_node_chain(container, chain_array) {

  var xScale = d3.scaleLinear().range([0, 1240]).domain([0, 2600])

  var yScale = d3.scaleLinear().range([150, 1100]).domain([8, 20])

  var violin_scale_x = d3.scaleLinear().range([0, 150]).domain([0, 600])

  var violin_scale_y = d3.scaleLinear().range([0, 1000]).domain([0, 0.05])

  var violin = d3.area()
    .x(function (d) {
      return xScale(d[0]);
    })
    .y0(function (d) {
      return violin_scale_y(d[1] / 2);
    })
    .y1(function (d) {
      return violin_scale_y(-d[1] / 2);
    });


  var bar = container.append('g').attr('transform', 'translate(150,0)')

  var chain_group_hour = {}

  var od_dur_group = {}

  var node_location_dict = {}

  chain_array.forEach(function (chain) {

    var node = chain.getHead()

    var head_hour = node.element.end_date_time.getHours()

    if (head_hour % 2 == 0 && head_hour > 6) {

      if (chain_group_hour[head_hour] != undefined) {

        chain_group_hour[head_hour].push(chain)
      }
      else {

        chain_group_hour[head_hour] = []
        chain_group_hour[head_hour].push(chain)
      }

      while (node != undefined) {

        if (node_location_dict[node.element.station_id] == undefined) {

          node_location_dict[node.element.station_id] = d3.keys(node_location_dict).length
        }

        node = node.next;
      }


    }

  })

  var waiting_group = {}

  for (hour in chain_group_hour) {

    chain_group_hour[hour].forEach(function (chain) {

      var node = chain.getHead()

      if (waiting_group[node.element.end_date_time.getHours()] != undefined) {

        waiting_group[node.element.end_date_time.getHours()].push(node.element)
      }
      else {

        waiting_group[node.element.end_date_time.getHours()] = []

        waiting_group[node.element.end_date_time.getHours()].push(node.element)
      }

      while (node.next != undefined) {

        if (node_location_dict[node.element.station_id] == undefined) {

          node_location_dict[node.element.station_id] = d3.keys(node_location_dict).length
        }
        var pair = hour + '&' + node.element.station_id + '&' + node.next.element.station_id;

        if (node.next.element.start_date_time.getTime() - node.element.end_date_time.getTime() > 30000 && node.next.element.start_date_time.getTime() - node.element.end_date_time.getTime() < 1000000) {
          if (od_dur_group[pair] != undefined) {

            od_dur_group[pair].push([node.element, node.next.element])
          }
          else {

            od_dur_group[pair] = []
            od_dur_group[pair].push([node.element, node.next.element])
          }
        }

        node = node.next;
      }
    })

  }

  var day_group = {}

  for (head in waiting_group) {

    waiting_group[head].forEach(function (d) {

      var day = d.start_date_time.getDate()

      if (day_group[day] != undefined) {

        if (day_group[day][head] != undefined) {

          day_group[day][head].push(d)
        }
        else {

          day_group[day][head] = []
          day_group[day][head].push(d)
        }
      }
      else {

        day_group[day] = {}
        day_group[day][head] = []
        day_group[day][head].push(d)
      }
    })
  }

  var waiting_array = {}

  for (day in day_group) {

    for (hour in day_group[day]) {

      min = d3.min(day_group[day][hour], function (d) {

        if (d.start_date_time.getHours() == d.end_date_time.getHours()) {

          return d.end_date_time.getMinutes() * 60 + d.end_date_time.getSeconds()
        }
        else {
          return 0
        }

      })

      if (waiting_array[hour] != undefined) {

        waiting_array[hour].push(min)
      }
      else {

        waiting_array[hour] = []
        waiting_array[hour].push(min)
      }

      min = d3.min(day_group[day][hour].filter(function (d) {

        return d.end_date_time.getMinutes() >= 30
      }), function (d) {

        if (d.start_date_time.getMinutes() >= 30) {

          return d.end_date_time.getMinutes() * 60 + d.end_date_time.getSeconds() - 30 * 60
        }
        else {
          return 0
        }

      })

      if (min == undefined) min = 40

      if (waiting_array[hour] != undefined) {

        waiting_array[hour].push(min)
      }
      else {

        waiting_array[hour] = []
        waiting_array[hour].push(min)
      }


    }

  }

  location_records_dict = {}

  var used_time = {}

  var waiting_time = {}

  for (head in od_dur_group) {


    if (od_dur_group[head].length >= 20) {

      var hour = parseInt(head.split('&')[0])

      var source = head.split('&')[1]

      var target = head.split('&')[2]

      var dur_array = []

      var pervious_location = location_records_dict[hour + '&' + source]

      if (pervious_location != undefined) {

        od_dur_group[head].forEach(function (OD) {

          var source_records = OD[0]

          var target_records = OD[1]

          var duration = target_records.end_date_time.getTime() / 1000 - source_records.end_date_time.getTime() / 1000

          dur_array.push(duration)
        })


        var mean_dur = math.mean(dur_array)

        if (used_time[hour] != undefined) {

          used_time[hour].push(dur_array);
        }
        else {

          used_time[hour] = []
          used_time[hour].push(dur_array);
        }

        var min_dur = math.quantileSeq(dur_array, 0.2)

        var max_dur = math.quantileSeq(dur_array, 0.8)

        var middle_dur = math.quantileSeq(dur_array, 0.7)

        var aa_dur = math.quantileSeq(dur_array, 0.3)

        if (target == back_beginer) {

          min_dur = math.quantileSeq(dur_array, 0.1)

          max_dur = math.quantileSeq(dur_array, 0.9)

          middle_dur = math.quantileSeq(dur_array, 0.7)

          aa_dur = math.quantileSeq(dur_array, 0.3)
        }

        var radius1 = xScale(max_dur) - xScale(mean_dur)

        var radius2 = xScale(mean_dur) - xScale(min_dur)

        var radius3 = xScale(middle_dur) - xScale(mean_dur)

        var radius4 = xScale(mean_dur) - xScale(aa_dur)

        bar
          .append('circle')
          .attr('r', 5)
          .attr('cx', function (d, i) {

            return pervious_location + xScale(mean_dur)
          })
          .attr('cy', function (d) {

            return yScale(hour)
          })
          .attr('fill', function (d) {

            if (target == back_beginer) {

              return '#FD7400'
            }
            else return '#333'

          })

        var arc = d3.arc()
          .innerRadius(0)
          .outerRadius(240)
          .startAngle(0)
          .endAngle(Math.PI)

        bar
          .append('g')
          .attr('transform', 'translate(' + (pervious_location + xScale(mean_dur)) + ',' + yScale(hour) + ')')
          .append('path')
          .attr('d', arc.outerRadius(radius1))
          .attr('fill', 'grey')
          .attr('opacity', 0.3)

        bar
          .append('g')
          .attr('transform', 'translate(' + (pervious_location + xScale(mean_dur)) + ',' + yScale(hour) + ')')
          .append('path')
          .attr('d', arc.outerRadius(radius2).endAngle(-Math.PI))
          .attr('fill', 'grey')
          .attr('opacity', 0.3)

        bar
          .append('g')
          .attr('transform', 'translate(' + (pervious_location + xScale(mean_dur)) + ',' + yScale(hour) + ')')
          .append('path')
          .attr('d', arc.outerRadius(radius3).endAngle(Math.PI))
          .attr('fill', 'grey')
          .attr('opacity', 0.3)

        bar
          .append('g')
          .attr('transform', 'translate(' + (pervious_location + xScale(mean_dur)) + ',' + yScale(hour) + ')')
          .append('path')
          .attr('d', arc.outerRadius(radius4).endAngle(-Math.PI))
          .attr('fill', 'grey')
          .attr('opacity', 0.3)

        bar
          .append('line')
          .attr('x1', function (d, i) {

            return pervious_location
          })
          .attr('y1', function (d) {

            return yScale(hour)
          })
          .attr('x2', function (d, i) {

            return pervious_location + xScale(mean_dur)
          })
          .attr('y2', function (d) {

            return yScale(hour)
          })
          .attr('stroke', 'black')
          .attr('stroke-dasharray', '4,4')

        if (location_records_dict[hour + '&' + target] == undefined)
          location_records_dict[hour + '&' + target] = pervious_location + xScale(mean_dur)
      }
      else {

        od_dur_group[head].forEach(function (OD) {

          var source_records = OD[0]

          var target_records = OD[1]

          var duration = target_records.end_date_time.getTime() / 1000 - source_records.end_date_time.getTime() / 1000

          dur_array.push(duration)
        })

        var data = waiting_array[hour]

        var min = d3.min(data, function (d) {
          return d
        })
        var max = d3.max(data, function (d) {
          return d
        })

        var waiting_mean = math.mean(data)

        waiting_time[hour] = data

        violin_scale_x.domain([0, max])
        //violin_scale_x.range([min/10,max/10])

        var leftMargin = xScale(waiting_mean)

        var kde = kernelDensityEstimator(epanechnikovKernel(100), violin_scale_x.ticks(100));
        var kdeVerteces = kde(data);

        bar.append('g')
          .attr('transform', 'translate(0,' + yScale(hour) + ')')
          .append("path")
          .datum(kdeVerteces)
          .attr("class", "line")
          .attr('fill', '#FFE11A')
          .attr('fill-opacity', 0.5)
          .attr('stroke', '#FFE11A')
          .attr("d", violin);

        var mean_dur = math.mean(dur_array)

        var min_dur = math.quantileSeq(dur_array, 0.2)

        var max_dur = math.quantileSeq(dur_array, 0.8)

        var middle_dur = math.quantileSeq(dur_array, 0.7)

        var aa_dur = math.quantileSeq(dur_array, 0.3)

        var radius1 = xScale(max_dur) - xScale(mean_dur)

        var radius2 = xScale(mean_dur) - xScale(min_dur)

        var radius3 = xScale(middle_dur) - xScale(mean_dur)

        var radius4 = xScale(mean_dur) - xScale(aa_dur)

        var arc = d3.arc()
          .innerRadius(0)
          .outerRadius(240)
          .startAngle(0)
          .endAngle(Math.PI)


        if (location_records_dict[hour + '&' + target] == undefined) {


          bar
            .append('circle')
            .attr('r', 5)
            .attr('cx', function (d, i) {

              return leftMargin + xScale(mean_dur)
            })
            .attr('cy', function (d) {

              return yScale(hour)
            })
            .attr('fill', '#333')

          bar
            .append('g')
            .attr('transform', 'translate(' + (leftMargin + xScale(mean_dur)) + ',' + yScale(hour) + ')')
            .append('path')
            .attr('d', arc.outerRadius(radius1))
            .attr('fill', 'grey')
            .attr('opacity', 0.3)

          bar
            .append('g')
            .attr('transform', 'translate(' + (leftMargin + xScale(mean_dur)) + ',' + yScale(hour) + ')')
            .append('path')
            .attr('d', arc.outerRadius(radius2).endAngle(-Math.PI))
            .attr('fill', 'grey')
            .attr('opacity', 0.3)

          bar
            .append('g')
            .attr('transform', 'translate(' + (leftMargin + xScale(mean_dur)) + ',' + yScale(hour) + ')')
            .append('path')
            .attr('d', arc.outerRadius(radius3).endAngle(Math.PI))
            .attr('fill', 'grey')
            .attr('opacity', 0.3)

          bar
            .append('g')
            .attr('transform', 'translate(' + (leftMargin + xScale(mean_dur)) + ',' + yScale(hour) + ')')
            .append('path')
            .attr('d', arc.outerRadius(radius4).endAngle(Math.PI))
            .attr('fill', 'grey')
            .attr('opacity', 0.3)

        }


        bar
          .append('circle')
          .attr('r', 5)
          .attr('cx', function (d, i) {

            return leftMargin
          })
          .attr('cy', function (d) {

            return yScale(hour)
          })
          .attr('fill', function (d) {

            if (source == go_beginer) {

              return '#BEDB39'
            }
            else return '#333'

          })


        bar
          .append('line')
          .attr('x1', function (d, i) {

            return leftMargin
          })
          .attr('y1', function (d) {

            return yScale(hour)
          })
          .attr('x2', function (d, i) {

            return leftMargin + xScale(mean_dur)
          })
          .attr('y2', function (d) {

            return yScale(hour)
          })
          .attr('stroke', 'black')
          .attr('stroke-dasharray', '4,4')

        bar.append('text')
          .attr('x', (leftMargin) / 2)
          .attr('y', yScale(hour) + 3)
          .attr('text-anchor', 'middle')
          .attr('text-align', 'center')
          .text('-| ' + parseInt(waiting_mean * 10 / 60) / 10 + ' min' + ' |-')
          .attr('font-size', 11)

        location_records_dict[hour + '&' + source] = leftMargin

        if (location_records_dict[hour + '&' + target] == undefined)
          location_records_dict[hour + '&' + target] = leftMargin + xScale(mean_dur)
      }

    }

  }


  bar.append("g")
    .attr("transform", "translate(0," + 50 + ")")
    .call(d3.axisTop(xScale).tickFormat(function (d) {

      return parseInt(d / 60) + ' min'
    }));

  container.append("g")
    .attr("transform", "translate(100," + 0 + ")")
    .call(d3.axisLeft(yScale).tickFormat(function (d) {

      return d + ' : 00'
    }));

  bar.selectAll('.label')
    .data(d3.keys(location_records_dict))
    .enter()
    .append('g')
    .attr('transform', function (d) {
      return 'translate(' + ((location_records_dict[d]) + 5) + ',' + (yScale(parseInt(d.split('&')[0])) - 5) + ')'
    })
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('transform', 'rotate(-45)')
    .text(function (d) {

      return station_info[d.split('&')[1]]
    })

  var g = bar.append('g').attr('class', 'indicate')


  for (var hour = 8; hour <= 20; hour += 2) {


    g.append('line')
      .attr('x1', location_records_dict[hour + '&' + go_beginer])
      .attr('x2', location_records_dict[hour + '&' + go_beginer])
      .attr('y1', yScale(hour) + 45)
      .attr('y2', yScale(hour) + 55)
      .attr('fill', 'none')
      .attr('stroke', 'black')

    g.append('line')
      .attr('x1', location_records_dict[hour + '&' + back_beginer])
      .attr('x2', location_records_dict[hour + '&' + back_beginer])
      .attr('y1', yScale(hour) + 45)
      .attr('y2', yScale(hour) + 55)
      .attr('fill', 'none')
      .attr('stroke', 'black')


    g.append('line')
      .attr('x1', location_records_dict[hour + '&' + go_beginer])
      .attr('x2', location_records_dict[hour + '&' + back_beginer])
      .attr('y1', yScale(hour) + 50)
      .attr('y2', yScale(hour) + 50)
      .attr('stroke-dasharray', '4,4')
      .attr('fill', 'none')
      .attr('stroke', 'black')

    g.append('rect')
      .attr('x', (location_records_dict[hour + '&' + go_beginer] + location_records_dict[hour + '&' + back_beginer]) / 2 - 25)
      .attr('y', yScale(hour) + 40)
      .attr('width', 50)
      .attr('height', 20)
      .attr('fill', 'white')

    g.append('text')
      .attr('x', (location_records_dict[hour + '&' + go_beginer] + location_records_dict[hour + '&' + back_beginer]) / 2)
      .attr('y', yScale(hour) + 55)
      .attr('width', 50)
      .attr('height', 20)
      .attr('text-anchor', 'middle')
      .attr('text-align', 'center')
      .text(parseInt(d3.sum(used_time[hour], function (d) {
        return d3.mean(d)
      }) / 60) + ' min')

    var total_time = []

    var min = d3.min(used_time[hour], function (d) {

      return d.length
    })

    for (var i = 0; i < min; i++) {

      var summ = 0

      for (var j = 0; j < 12; j += 1) {

        summ += parseInt(used_time[hour][j][i])

      }

      total_time.push(summ)
    }


    var seqData = math.quantileSeq(total_time, [0.1, 0.3, 0.5, 0.7, 0.9])

    var waitingData = math.quantileSeq(waiting_time[hour], [0.1, 0.3, 0.5, 0.7, 0.9])

    for (var i = 0; i < seqData.length; i++) {

      seqData[i] += waitingData[i]
    }

    var barData = [[seqData[0], seqData[1]], [seqData[1], seqData[2]], [seqData[2], seqData[3]], [seqData[3], seqData[4]]]

    var colorBar = ['#FD7400', '#FFE11A', '#BEDB39', '#1F8A70', '#004358']

    g.selectAll('.bar')
      .data(barData)
      .enter()
      .append('rect')
      .attr('x', function (d) {

        return xScale(d[0])
      })
      .attr('width', function (d) {

        return xScale(d[1] - d[0])
      })
      .attr('y', yScale(hour) - 40)
      .attr('height', 80)
      .attr('opacity', 0.1)
      .attr('fill', function (d, i) {

        return colorBar[i]
      })
  }


}

function kernelDensityEstimator(kernel, x) {
  return function (sample) {
    return x.map(function (x) {
      return [x, d3.mean(sample, function (v) {
        return kernel(x - v);
      })];
    });
  };
}

function epanechnikovKernel(scale) {
  return function (u) {
    return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
  };
}

create_yolk_plot()