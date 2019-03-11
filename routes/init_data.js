var express = require('express');
var router = express.Router();
router.get('/', function (req, res) {
  var mongodb = require('mongodb').MongoClient;
  var path = 'mongodb://localhost:27017/BusData';
  mongodb.connect(path, function (err, db) {
    init_data(db, function (result) {
      res.send(result);
      db.close();
    })
  });
  var init_data = function (db, callback) {
    var section = db.collection('section');
    var section_list, station_list, route_list, sign_list;
    var where_str = {};
    section.find(where_str, {'_id': 0}).toArray(function (err, section_result) {
      if (err) {
        console.log('Error:' + err);
        return;
      }
      else {
        section_list = section_result;
        var station = db.collection('station');
        station.find(where_str, {'_id': 0, 'id': 0}).toArray(function (err, station_result) {
          if (err) {
            console.log('Error:' + err);
            return;
          }
          else {
            station_list = station_result;
            var all_routes = db.collection('all_routes');
            all_routes.find(where_str, {'_id': 0, 'id': 0}).toArray(function (err, route_result) {
              if (err) {
                console.log('Error:' + err);
                return;
              }
              else {
                route_list = route_result;
                var station_sign = db.collection('station_sign');
                station_sign.find(where_str, {'_id': 0}).toArray(function (err, sign_result) {
                  if (err) {
                    console.log('Error:' + err);
                    return;
                  }
                  else {
                    sign_list = sign_result;
                    var data_list = {
                      'station': station_list,
                      'section': section_list,
                      'route': route_list,
                      'sign': sign_list
                    };
                    callback(data_list);
                  }
                });
              }
            });
          }
        });
      }
    });
  };
});
module.exports = router;
