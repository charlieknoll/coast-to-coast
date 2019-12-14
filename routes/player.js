var express = require('express');
var router = express.Router();
var { playerController } = require('./../services/')
const asyncHandler = require('express-async-handler')
/* GET home page. */
router.get('/seek/:t', asyncHandler(async function (req, res, next) {
  await playerController.seek(req.params.t)
  res.writeHead(200)
  res.end()
}));
router.get('/seek-percentage/:p', asyncHandler(async function (req, res, next) {
  await playerController.seekPercentage(req.params.p)
  res.writeHead(200)
  res.end()
}));
router.get('/play-pause', asyncHandler(async function (req, res, next) {
  await playerController.playPause()
  res.writeHead(200)
  res.end()
}));
router.get('/resume', asyncHandler(async function (req, res, next) {
  await playerController.resume(req.query.url, req.query.t)
  res.writeHead(200)
  res.end()
}));
router.get('/current-time', asyncHandler(async function (req, res, next) {
  const result = await playerController.currentTime()
  res.send('time:' + result)
}));


module.exports = router;
