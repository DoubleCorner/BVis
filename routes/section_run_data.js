/**
 * Created by Corner on 2017/3/28.
 */
var express = require('express');
var router = express.Router();
router.get('/no_route', function (req, res) {
  var condition = {
    'section_id': req.query.section_id,
    'start_time': parseInt(req.query.start_time),
    'end_time': parseInt(req.query.end_time)
  };
  var start = new Date(condition.start_time);
  var end = new Date(condition.end_time);
  var mongodb = require('mongodb').MongoClient;
  var path = 'mongodb://localhost:27017/BusData';
  mongodb.connect(path, function (err, db) {
    section_run_data(db, function (result) {
      res.send(result);
      db.close();
    })
  });
  var section_run_data = function (db, callback) {
    var station_run = db.collection("section_run_data");
    var ave_speed = -1;
    var where_str = {
      'section_id': parseInt(condition.section_id),
      'end_date_time': {'$gte': start, '$lte': end},
      'speed': {'$lte': 60}
    };
    station_run.find(where_str, {
      'speed': 1,
      '_id': 0
    }).toArray(function (err, result) {
      if (err) {
        console.log('Error:' + err);
        return;
      }
      else {
        if (result.length !== 0) {
          ave_speed = 0;
          for (var i = 0, len = result.length; i !== len; ++i) {
            ave_speed += result[i].speed;
          }
          ave_speed = (ave_speed / len).toFixed(2);
        }
        callback(ave_speed.toString());//如果-1，没有该路段数据
      }
    });
  }
});
router.get('/with_route', function (req, res) {
  var condition = {
    'sub_route_id': req.query.sub_route_id,
    'section_id': req.query.section_id,
    'start_time': parseInt(req.query.start_time),
    'end_time': parseInt(req.query.end_time)
  };
  var start = new Date(condition.start_time);
  var end = new Date(condition.end_time);
  var mongodb = require('mongodb').MongoClient;
  var path = 'mongodb://localhost:27017/BusData';
  mongodb.connect(path, function (err, db) {
    section_run_data(db, function (result) {
      res.send(result);
      db.close();
    })
  });
  var section_run_data = function (db, callback) {
    var station_run = db.collection("section_run_data");
    var ave_speed = -1;
    var where_str = {
      'sub_route_id': condition.sub_route_id,
      'section_id': parseInt(condition.section_id),
      'end_date_time': {'$gte': start, '$lte': end},
      'speed': {'$lte': 60}
    };
    station_run.find(where_str, {
      'speed': 1,
      '_id': 0
    }).toArray(function (err, result) {
      if (err) {
        console.log('Error:' + err);
        return;
      }
      else {
        if (result.length !== 0) {
          ave_speed = 0;
          for (var i = 0, len = result.length; i !== len; ++i) {
            ave_speed += result[i].speed;
          }
          ave_speed = (ave_speed / len).toFixed(2);
        }
        callback(ave_speed.toString());//如果-1，没有该路段数据
      }
    });
  }
});
router.get('/one_section', function (req, res) {
  var condition = {
    'section_id': req.query.section_id
  };
  var mongodb = require('mongodb').MongoClient;
  var path = 'mongodb://localhost:27017/BusData';
  mongodb.connect(path, function (err, db) {
    section_run_data(db, function (result) {
      res.send(result);
      db.close();
    })
  });
  var section_run_data = function (db, callback) {
    var station_run = db.collection("section_run_data");
    var where_str = {
      'section_id': parseInt(condition.section_id),
      'speed': {'$lte': 60}
    };
    station_run.find(where_str, {
      'speed': 1,
      'end_date_time': 1,
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