const puppeteer = require('puppeteer-core')
const app = require('../app')

var port = normalizePort(process.env.PORT || '8085');
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
const pageProvider = {
  page: null,
  init: async function () {
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    })
    const page = await browser.newPage()
    const response = await page.goto('http://localhost:' + port + '/backend.html', { waitUntil: 'load' })
    this.page = page
  }
}
pageProvider.init()

module.exports = pageProvider



