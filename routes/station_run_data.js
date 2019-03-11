/**
 * Created by Corner on 2017/3/28.
 */
var express = require('express');
var router = express.Router();
router.get('/', function (req, res) {
  var condition = {
    'station_id': req.query.station_id
  };
  var mongodb = require('mongodb').MongoClient;
  var path = 'mongodb://localhost:27017/BusData';
  mongodb.connect(path, function (err, db) {
    station_run_data(db, function (result) {
      res.send(result);
      db.close();
    })
  });
  var station_run_data = function (db, callback) {
    var station_run = db.collection("station_run_data");
    var where_str = {
      'station_id': condition.station_id,
      'stay_time': {'$lt': 120}
    };
    station_run.find(where_str, {
      'route_id': 1,
      'end_date_time': 1,
      'stay_time': 1,
      '_id': 0
    }).sort({'end_date_time': 1}).toArray(function (err, result) {
      if (err) {
        console.log('Error:' + err);
        return;
      }
      else {
        callback(result);
      }
    });
  }
});
module.exports = router;