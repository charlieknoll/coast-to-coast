function ViewModel() {
  this.baseUrl = 'https://statsapi.web.nhl.com/api/v1/';
  this.games = ko.observable();
  this.currentPlaybackId = null;
  this.dateOffset = ko.observable(0);
  this.scheduleDate = ko.computed(function () {
    return moment().add(this.dateOffset(), 'days').format('MMM Do')
  }, this);
  this.scheduleDateParam = function () {
    return moment().add(this.dateOffset(), 'days').format('YYYY-MM-DD')
  };
  this.playbackCache = {};
  this.init = async function () {
    console.log('init');
    const localStorageCache = window.localStorage.getItem('playbackCache')
    if (localStorageCache) this.playbackCache = JSON.parse(localStorageCache);

    [].slice.call(document.getElementsByClassName('item')).map(i => {
      i.onclick = async function (e) {
        e.preventDefault();
        const path = e.target.dataset.path
        await playerProxy.exec(path)
      }
    });
    document.getElementById('prevDate').onclick = async function (e) {
      e.preventDefault();
      await viewModel.incDate(-1)
    }
    document.getElementById('nextDate').onclick = async function (e) {
      e.preventDefault();
      await viewModel.incDate(1)
    }
    await this.loadSchedule()
    window.setInterval(async function () {
      if (!viewModel.currentPlaybackId) return
      viewModel.playbackCache[viewModel.currentPlaybackId] = await playerProxy.getCurrentTime()
      window.localStorage.setItem('playbackCache', JSON.stringify(viewModel.playbackCache));

    }, 2000)

    // const avsGame = this.games().find((g) => g.teams.away.team.id === 21 || g.teams.home.team.id === 21)
  };
  this.incDate = async function (n) {
    this.dateOffset(n + this.dateOffset())
    await this.loadSchedule()
  };
  this.loadSchedule = async function () {
    document.getElementById('gameList').style.display = 'none'
    document.getElementById('loading').style.display = ''
    const schedule = await this.getSchedule()
    const games = schedule.dates[0].games
    for (var i = 0; i < games.length; i++) {
      games[i].teams.away.team.record = games[i].teams.away.leagueRecord.wins + '-' +
        games[i].teams.away.leagueRecord.losses + '-' +
        games[i].teams.away.leagueRecord.ot
      games[i].teams.home.team.record = games[i].teams.home.leagueRecord.wins + '-' +
        games[i].teams.home.leagueRecord.losses + '-' +
        games[i].teams.home.leagueRecord.ot
      games[i].gameDateStr = new Date(games[i].gameDate).toLocaleString('en-US', { timeZone: "America/Denver", dateStyle: "short", timeStyle: "short", hour12: true }).split(',')[1]
      games[i].teams.home.team.logo = 'https://www-league.nhlstatic.com/images/logos/teams-current-circle/' +
        games[i].teams.home.team.id + '.svg'
      games[i].teams.away.team.logo = 'https://www-league.nhlstatic.com/images/logos/teams-current-circle/' +
        games[i].teams.away.team.id + '.svg'

      const game = await this.getGame(games[i].gamePk)
      games[i].feeds = game.media.epg.find(e => e.title == 'NHLTV').items
      const highlights = game.media.epg.find(e => e.title == 'Extended Highlights').items
      if (highlights[0]) {
        const xHighlight = highlights[0].playbacks.find(p => p.name == 'HTTP_CLOUD_WIRED_60')
        if (xHighlight) {
          games[i].feeds.push({
            mediaFeedType: "HIGHLIGHTS",
            mediaPlaybackId: highlights[0].mediaPlaybackId,
            url: xHighlight.url
          })
        }
      }
    }
    this.games(games)
    document.getElementById('gameList').style.display = 'initial'
    document.getElementById('loading').style.display = 'none'
  };
  this.getDefaultFeed = function (items) {
    return items[0].mediaPlaybackId
  };
  this.formatUrl = function (urlStr, params) {
    return urlStr + '?' + new URLSearchParams(params).toString()
  };
  this.playFeed = async function (e) {
    var self = this;
    //e.preventDefault()
    if (!e.url) {
      const url = viewModel.formatUrl('https://cors-anywhere.herokuapp.com/http://nhl.freegamez.ga/getM3U8.php', {
        league: 'nhl',
        date: viewModel.scheduleDateParam(),
        id: e.mediaPlaybackId,
        cdn: 'akc'
      })

      const response = await fetch(url)
      const feedUrl = await response.text()
      if (feedUrl.substring(0, 3) == 'Not') {
        alert(feedUrl)
        return
      }
      e.url = feedUrl
    }
    if (viewModel.currentPlaybackId) {
      viewModel.playbackCache[viewModel.currentPlaybackId] = await playerProxy.getCurrentTime()
    }
    //if live start at 50 minutes from start of live feed
    playerProxy.load(e.url, viewModel.playbackCache[e.mediaPlaybackId] ? viewModel.playbackCache[e.mediaPlaybackId] : (e.gameType != 'R' ? 3600 : 0))
    viewModel.currentPlaybackId = e.mediaPlaybackId;
    window.localStorage.setItem('playbackCache', JSON.stringify(viewModel.playbackCache));

  };
  this.getGame = async function (id) {
    const response = await fetch(this.baseUrl + 'game/' + id + '/content')
    return await response.json()
  };
  this.getSchedule = async function () {
    const response = await fetch(this.baseUrl + 'schedule?date=' + this.scheduleDateParam())
    return await response.json()
  }
}
var viewModel = new ViewModel()
ko.applyBindings(viewModel)
viewModel.init()



