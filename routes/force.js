var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.render('force.html');
});

module.exports = router;
