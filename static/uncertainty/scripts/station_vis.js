function create_station_vis() {

  var aim_station = '11000051';

  d3.csv('/static/uncertainty/files/station_check_data3.csv', function (data) {

    var width = 1700;

    var height = 970;

    var route_dict = {};

    var container = d3.select('#main').append('svg').attr('width', width + 100).attr('height', height);

    data.forEach(function (d) {

      d.start_date_time = new Date(d.start_date_time);

      d.end_date_time = new Date(d.end_date_time)
    });

    data = data.filter(function (d) {

      return d.end_date_time.getTime() < new Date('2016-1-1 24:00:00')
    });

    data.forEach(function (d) {

      if (route_dict[d.route_id] === undefined)

        route_dict[d.route_id] = d3.keys(route_dict).length
    });


    var svg = container.append('g')
      .attr('transform', 'translate(100,' + (100) + ')');

    var tScale = d3.scaleTime()
      .domain([new Date('2016-1-1 6:00:00'), new Date('2016-1-2 1:00:00')])
      .range([0, width - 100]);


    svg.selectAll('.check_bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', function (d) {

        return tScale(d.start_date_time)
      })
      .attr('y', function (d) {

        var base = route_dict[d.route_id] * 50;

        if (d.station_id === aim_station)
          return base - 5;
        else
          return base + 5;
      })
      .attr('width', function (d) {

        var a = d.start_date_time;

        var b = d.end_date_time;

        return tScale(b) - tScale(a)
      })
      .attr('height', function (d) {

        return 4
      })
      .attr('fill', function (d) {

        return d.station_id === aim_station ? '#c33' : '#333';
      })
      .attr('opacity', 0.3);


    svg.selectAll('.check_point')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', function (d) {

        return tScale(d.start_date_time)
      })
      .attr('cy', function (d) {

        var base = route_dict[d.route_id] * 50;

        if (d.station_id === aim_station)
          return base - 15;
        else
          return base + 15;
      })
      .attr('r', function (d) {

        return 2
      })
      .attr('fill', function (d) {

        return d.station_id === aim_station ? '#c33' : '#333';
      })
      .attr('opacity', 0.7);

    svg.selectAll('.route_name')
      .data(d3.keys(route_dict))
      .enter()
      .append('text')
      .attr('x', width - 100)
      .attr('y', function (d) {

        return route_dict[d] * 50
      })
      .text(function (d) {

        return d
      });

    svg.append("g")
      .attr("transform", "translate(0," + d3.keys(route_dict).length * 50 + ")")
      .call(d3.axisBottom(tScale))


  })
}

create_station_vis();