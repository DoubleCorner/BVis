/**
 * Created by Corner on 2017/4/21.
 */
function CalStaticValueClass() {
  var adjacency_list = [];
  var net_add_degree = 0;
  stations_info.forEach(function (x) {
    var in_degree = 0;
    var out_degree = 0;
    sections_info.forEach(function (y) {
      if (x.station_id === y.from_id) {
        out_degree++;
      }
      if (x.station_id === y.target_id) {
        in_degree++;
      }
    });
    var item = {
        station_name: x.station_name,
        station_id: x.station_id,
        in_degree: in_degree,
        out_degree: out_degree,
        degree: in_degree + out_degree,
        join_degree: 0,
        add_degree: 0,
        DN_result: 0
      }
    ;
    adjacency_list.push(item);
  });
  adjacency_list.forEach(function (x) {
    var join_degree = 0;
    sections_info.forEach(function (y) {
      if (x.station_id === y.from_id) {
        adjacency_list.forEach(function (z) {
          if (y.target_id === z.station_id) {
            join_degree += z.degree;
          }
        })
      }

      if (x.station_id === y.target_id) {
        adjacency_list.forEach(function (z) {
          if (y.from_id === z.station_id) {
            join_degree += z.degree;
          }
        })
      }
    });
    x.join_degree = join_degree;
    x.add_degree = join_degree + x.degree;
  });
  adjacency_list.forEach(function (x) {
    net_add_degree += x.add_degree;
    console.log(x.station_name, x.station_id, x.in_degree, x.out_degree, x.degree, x.join_degree, x.add_degree);
  });


  adjacency_list.forEach(function (x) {
    var new_net = [];
    var new_adjacency = [];
    var new_net_add_degree = 0;
    sections_info.forEach(function (y) {
      if (x.station_id !== y.from_id && x.station_id !== y.target_id) {
        new_net.push(y);
      }
    });
    adjacency_list.forEach(function (z) {
      if (z.station_id !== x.station_id) {
        var in_degree = 0;
        var out_degree = 0;
        new_net.forEach(function (l) {
          if (z.station_id === l.from_id) {
            out_degree++;
          }
          if (z.station_id === l.target_id) {
            in_degree++;
          }
        });
        var item = {
          station_name: z.station_name,
          station_id: z.station_id,
          in_degree: in_degree,
          out_degree: out_degree,
          degree: in_degree + out_degree,
          join_degree: 0,
          add_degree: 0
        };
        new_adjacency.push(item);
      }
    });
    new_adjacency.forEach(function (m) {
      var join_degree = 0;
      new_net.forEach(function (n) {
        if (m.station_id === n.from_id) {
          new_adjacency.forEach(function (p) {
            if (n.target_id === p.station_id) {
              join_degree += p.degree;
            }
          })
        }
        if (m.station_id === n.target_id) {
          new_adjacency.forEach(function (p) {
            if (n.from_id === p.station_id) {
              join_degree += p.degree;
            }
          })
        }
      });
      m.join_degree = join_degree;
      m.add_degree = join_degree + m.degree;
    });
    new_adjacency.forEach(function (b) {
      new_net_add_degree += b.add_degree;
    });
    x.DN_result = net_add_degree - new_net_add_degree;
    console.log(x.station_id, x.station_name, x.DN_result);
  });
  console.log(adjacency_list);
}