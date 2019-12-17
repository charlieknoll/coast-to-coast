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
router.get('/status', asyncHandler(async function (req, res, next) {
  const result = await playerController.status()
  res.send(result)
}));
router.get('/toggle', asyncHandler(async function (req, res, next) {
  await playerController.toggle()
  res.writeHead(200)
  res.end()
}));
router.get('/cast/:d', asyncHandler(async function (req, res, next) {
  await playerController.cast(req.params.d)
  res.writeHead(200)
  res.end()
}));
router.get('/reset', asyncHandler(async function (req, res, next) {
  await playerController.reset()
  res.writeHead(200)
  res.end()
}));

module.exports = router;
