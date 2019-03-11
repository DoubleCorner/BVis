function create_box_vis() {

  var colors = d3.scaleOrdinal(d3.schemeCategory20c);

  var width = 1700;

  var height = 300;

  var container = d3.select('#main').append('svg').attr('width', width + 200).attr('height', height * 32 + 100);

  var day_group = {};

  var station_dict = {};

  var goScale = d3.scaleLinear().range([30, height]);

  d3.csv('/static/uncertainty/files/station_run_data2.csv', function (data) {

    data.forEach(function (d) {

      d.start_date_time = new Date(d.start_date_time);

      d.end_date_time = new Date(d.end_date_time);

      day = d.start_date_time.getDate();

      if (day_group[day] !== undefined) {

        day_group[day].push(d)
      }
      else {

        day_group[day] = [];
        day_group[day].push(d);
      }

    });

    var counter = 0;

    for (day in day_group) {

      var tScale = d3.scaleTime().range([50, width])
        .domain([new Date('2016-1-' + day + ' 6:00:00'), new Date('2016-1-' + day + ' 23:00:00')]);


      var svg = container.append('g')
        .attr('transform', 'translate(0,' + (height * counter) + ')');

      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(tScale));
      //.select(".domain")
      //.remove();


      var product_group = {};

      var line_group = {};

      line_group['go'] = [];

      line_group['back'] = [];

      var station_location_dict = {};

      station_location_dict['go'] = {};

      station_location_dict['back'] = {};

      dd = day_group[day];

      dd.forEach(function (d) {

        if (product_group[d.product_id] !== undefined) {

          product_group[d.product_id].push(d);
        }
        else {

          product_group[d.product_id] = [];
          product_group[d.product_id].push(d);
        }
      });

      for (product in product_group) {

        var meta = [];

        var product_array = product_group[product];

        product_array = product_array.sort(function (a, b) {

          return a.start_date_time.getTime() - b.start_date_time.getTime()
        });

        for (i = 0; i < product_array.length; i++) {

          meta.push(product_array[i]);

          station_dict[product_array[i].station_id] = product_array[i].station_name;

          if (i < product_array.length) {

            if (product_array[i].station_id === '10050074' || (product_array[i + 1] !== undefined && product_array[i + 1].station_id === '90050032')) {

              if (i > 0) {

                line_group['go'].push(meta);

                station_location_dict['go']['90050032'] = 0;

                //station_location_dict['go']['11090014'] = 0

                for (j = 0; j < meta.length; j++) {

                  if (j > 0) {

                    if (station_location_dict['go'][meta[j - 1].station_id] !== undefined) {

                      station_location_dict['go'][meta[j].station_id] = station_location_dict['go'][meta[j - 1].station_id] + 1
                    }
                  }
                }


                meta = []
              }

            }

          }

        }

      }

      goScale.domain([0, d3.keys(station_location_dict['go']).length]);

      var go_line_data = [];

      var back_line_data = [];

      var lineGeneretor = d3.line()
        .x(function (d) {
          return d.x
        })
        .y(function (d) {
          return d.y
        });


      line_group['go'].forEach(function (meta) {

        var meta_data = [];

        meta.forEach(function (d) {

          var x1 = tScale(d.start_date_time);

          var x2 = tScale(d.end_date_time);

          var y = goScale(station_location_dict['go'][d.station_id]);

          meta_data.push({'x': x1, 'y': y});

          meta_data.push({'x': x2, 'y': y})

        });

        go_line_data.push([meta_data, meta[0].product_id])

      });

      go_line_data.forEach(function (meta) {

        svg.append('path')
          .datum(meta[0])
          .attr('stroke', function (d) {

            return colors(meta[1])
          })
          .attr('stroke-width', function (d) {

            return 2
          })
          .attr('stroke-opacity', function (d) {

            return 0.7
          })
          .attr('fill', 'none')
          .attr('d', lineGeneretor)
      });

      counter += 1;

      svg.selectAll('.label')
        .data(d3.keys(station_location_dict['go']))
        .enter()
        .append('text')
        .attr('x', function (d, i) {

          return station_location_dict['go'][d] % 2 === 1 ? width + 50 : width + 150
        })
        .attr('y', function (d) {

          return goScale(station_location_dict['go'][d])
        })
        .attr('font-size', 10)
        .text(function (d) {

          return station_dict[d]
        })
    }

  })

}

create_box_vis();