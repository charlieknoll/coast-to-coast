const pageProvider = require('./pageProvider')

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
  currentTime: async function () {
    return await pageProvider.page.evaluate(() => {
      return player.getCurrentTime() + player.getStartTimeOffset()
    })
  },

}
module.exports = playerController
