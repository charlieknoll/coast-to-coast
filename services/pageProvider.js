const puppeteer = require('puppeteer-core')
const { spawnAsync } = require('./utils')
const path = require('path');

const cmdPath = path.join(__dirname + './../bin/chrome-debugging.bat')

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
const backendUrl = 'http://localhost:' + port + '/backend.html'
const pageProvider = {
  connect: async function () {
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    })
    const pages = await browser.pages()
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].url() == backendUrl) {
        this.page = pages[i]
      }

    }
    if (!this.page) {
      this.page = await browser.newPage()
      const response = await this.page.goto(backendUrl, { waitUntil: 'load' })
    }
  },
  page: null,
  init: async function () {
    try {
      await this.connect()
    } catch (e) {
      //const result = await execShellCommand(cmdPath)
      await spawnAsync('cmd.exe', ['/c', cmdPath]);
      //await spawnAsync(cmdPath);
      await this.connect()

    }

  }
}
pageProvider.init()

module.exports = pageProvider



