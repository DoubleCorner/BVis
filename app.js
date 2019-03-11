var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var home = require('./routes/home');
var significant = require('./routes/significant');
var force = require('./routes/force');
var uncertainty = require('./routes/uncertainty');
var init_data = require('./routes/init_data');
var station_run_data = require('./routes/station_run_data');
var section_run_data = require('./routes/section_run_data');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /static
//app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/static', express.static('static'));

app.use('/', home);
app.use('/index.html', significant);
app.use('/force.html', force);
app.use('/uncertainty.html', uncertainty);
app.use('/init_data', init_data);
app.use('/station_run_data', station_run_data);
app.use('/section_run_data', section_run_data);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error');
});

module.exports = app;
