const pageProvider = require('./pageProvider')
const path = require('path');
const { execAsync } = require('./utils')

const cmdPath = path.join(__dirname + './../bin/caston.exe')
let castDevice = -1
let lastDevice = -1

const playerController = {
  seek: async function (t) {
    await pageProvider.page.evaluate((t) => {
      player.seek(player.getCurrentTime() + parseInt(t));
    }, t)
  },
  seekPercentage: async function (p) {
    await pageProvider.page.evaluate((p) => {
      player.seekPercentage(parseInt(p));
    }, p)
  },
  resume: async function (url, t) {
    t = parseInt(t)
    if (t == 0) t = 1;
    await pageProvider.page.evaluate((url, t) => {
      player.load(url, false)
      player.seek(t);
    }, url, t)
    await pageProvider.page.evaluate(() => {
      player.play();
    })
  },
  playPause: async function () {
    await pageProvider.page.evaluate(() => {
      player.isPlaying() ? player.pause() : player.play();
    })
  },
  status: async function () {
    const result = await pageProvider.page.evaluate(() => {
      return {
        currentTime: parseInt(player.getCurrentTime() + player.getStartTimeOffset()),
        isPlaying: player.isPlaying(),
        duration: player.getDuration()
      }
    })
    result.castDevice = castDevice
    return result
  },
  toggle: async function () {
    await pageProvider.page.click('video', {
      clickCount: 2,
      delay: 100
    })
  },

  reset: async function () {
    if (castDevice == -1) return
    const initDevice = castDevice
    await this.toggle()
    await this.playPause()
    await this.cast(initDevice)
    await this.cast(initDevice)
    await this.playPause()
    await this.toggle()
  },
  cast: async function (n) {
    const result = await execAsync(cmdPath + ' ' + n)
    lastDevice = castDevice
    castDevice = n
    if (lastDevice == castDevice) castDevice = -1
  }
}
module.exports = playerController
