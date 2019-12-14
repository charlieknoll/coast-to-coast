var express = require('express');
var router = express.Router();
const path = require('path');

/* GET home page. */
router.get('/remote', function (req, res, next) {
  res.sendFile(path.join(__dirname + './../public/remote.html'));
});

module.exports = router;
