(function (open) {

  XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
    if (url.indexOf('https://mf.svc.nhl.com') != -1) {
      rewrittenUrl = url.replace("https://mf.svc.nhl.com", "https://nhl.freegamez.ga");
    } else { rewrittenUrl = url; }
    open.call(this, method, rewrittenUrl, async, user, pass);
  };
})(XMLHttpRequest.prototype.open);

var playerProxy = {
  exec: async function (action) {
    if (action.substring(0, 6) == 'seek-p') {
      const t = action.split('/')[1]
      player.seekPercentage(parseInt(t))
      return
    }
    if (action.substring(0, 4) == 'seek') {
      const t = action.split('/')[1]
      player.seek(player.getCurrentTime() + parseInt(t))
      return
    }
    if (action.substring(0, 4) == 'play') {
      player.isPlaying() ? player.pause() : player.play();
      return
    }
  },
  load: function (url, t) {
    player.load(url, false)
    player.seek(parseInt(t) + 1);
    //player.seek(10);
    player.play()
  },
  getCurrentTime: async function () {
    var time = player.getCurrentTime() + player.getStartTimeOffset()
    return player.getCurrentTime() + player.getStartTimeOffset()
  }
}

function getDimensions() {
  var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  var playerHeight
  switch (window.orientation) {
    case -90: case 90:
      playerHeight = parseInt(h * 9 / 16) - 10
      break;
    default:
      playerHeight = parseInt(w * 9 / 16)
      break;
  }

  return {
    width: w,
    height: playerHeight
  }

}
var player
function init() {
  var dimensions = getDimensions()
  window.player = new Clappr.Player({
    mimeType: "application/x-mpegURL",
    autoPlay: false,
    width: dimensions.width,
    height: dimensions.height,
    parentId: "#player",
    poster: "https://charlieknoll.github.io/coast2coast/images/poster.jpg",
    plugins: { 'core': [LevelSelector] }
  });
}

function doOnOrientationChange() {
  var dimensions = getDimensions()
  window.player.configure(dimensions)
}
window.addEventListener('orientationchange', doOnOrientationChange);

init()