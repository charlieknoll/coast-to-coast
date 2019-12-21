function ViewModel() {
  this.baseUrl = 'https://statsapi.web.nhl.com/api/v1/';
  this.games = ko.observable();
  this.currentPlaybackId = null;
  this.currentGame = null;
  this.devices = [1, 2, 3, 4];
  this.device = ko.observable(-1)
  this.scheduleDateParam = ko.observable(new moment().format('YYYY-MM-DD'));
  this.status = ko.observable({ castDevice: 0, currentTime: 0, duration: 0, isPlaying: false })
  this.currentTime = ko.computed(function () {
    function pad(num) {
      return ("0" + num).slice(-2);
    }
    function hhmmss(secs) {
      var minutes = Math.floor(secs / 60);
      secs = secs % 60;
      var hours = Math.floor(minutes / 60)
      minutes = minutes % 60;
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
      // return pad(hours)+":"+pad(minutes)+":"+pad(secs); for old browsers
    }
    function mmss(secs) {
      var minutes = Math.floor(secs / 60);
      secs = secs % 60;
      minutes = minutes % 60;
      return `${pad(minutes)}:${pad(secs)}`;
      // return pad(hours)+":"+pad(minutes)+":"+pad(secs); for old browsers
    }
    if (this.status().duration > 3599) {
      return hhmmss(this.status().currentTime) + ' | ' + hhmmss(this.status().duration)
    }
    return mmss(this.status().currentTime) + ' | ' + mmss(this.status().duration)

  }, this)
  this.incDate = async function (n) {
    viewModel.scheduleDateParam(moment(viewModel.scheduleDateParam()).add(n, 'days').format('YYYY-MM-DD'))
    await this.loadSchedule()
  };
  this.scheduleDate = ko.computed(function () {
    return moment(this.scheduleDateParam()).format('MMM Do')
  }, this);
  this.playbackCache = {};
  this.init = async function () {
    console.log('init');
    const localStorageCache = window.localStorage.getItem('playbackCache')
    if (localStorageCache) this.playbackCache = JSON.parse(localStorageCache);

    [].slice.call(document.getElementsByClassName('remote-button')).map(i => {
      i.onclick = async function (e) {
        e.preventDefault();
        let path = e.target.dataset.path
        if (!path) path = e.target.parentNode.dataset.path
        if (!path) path = e.target.parentNode.parentNode.dataset.path

        if (path == 'restart' && viewModel.currentGame) {
          path = viewModel.currentGame.mediaState == 'MEDIA_ON' ? 'seek/3600' : 'seek-percentage/0'
        }
        await playerProxy.exec(path)
      }
    });
    //this.avsGames = [{ date: '2019-12-16', team: 'St. Louis Blues', home: false, teamId: 5 }]
    document.getElementById('scheduleDate').onclick = function (e) {
      $('.date-picker').datepicker('show')
    }
    document.getElementById('datePicker').onchange = async function (e) {
      const newDate = new moment(e.target.value).format('YYYY-MM-DD')
      viewModel.scheduleDateParam(newDate)
      await viewModel.loadSchedule()
    }
    document.getElementById('prevDate').onclick = async function (e) {
      e.preventDefault();
      await viewModel.incDate(-1)
    }
    document.getElementById('nextDate').onclick = async function (e) {
      e.preventDefault();
      await viewModel.incDate(1)
    }
    await this.setAvsSchedule()
    await this.loadSchedule()
    $('.date-picker').datepicker({
      autoclose: true,
      orientation: 'bottom',
      format: 'yyyy-mm-dd',
      beforeShowDay: function (date) {
        const game = viewModel.avsGames.find(g => g.date == new moment(date).format("YYYY-MM-DD"))
        if (game) {
          return game.home.teamId == 21 ? { classes: 'home-game team-icon-' + game.away.teamId, tooltip: game.away.name } :
            { classes: 'away-game team-icon-' + game.home.teamId, tooltip: game.home.name }
        }

      }
    });
    window.setInterval(async function () {
      viewModel.status(await playerProxy.getStatus())
      if (!viewModel.currentPlaybackId) return
      if (viewModel.status().currentTime > 0) viewModel.playbackCache[viewModel.currentPlaybackId] = viewModel.status().currentTime;
      window.localStorage.setItem('playbackCache', JSON.stringify(viewModel.playbackCache));

    }, 1000)

    // const avsGame = this.games().find((g) => g.teams.away.team.id === 21 || g.teams.home.team.id === 21)
  };
  this.loadSchedule = async function () {
    document.getElementById('gameList').style.display = 'none'
    document.getElementById('gameHeader').style.display = 'none'
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
      games[i].editorialUrl = game.editorial.preview.items[0] ? game.editorial.preview.items[0].url : null
      games[i].editorialUrl = game.editorial.recap.items[0] ? game.editorial.recap.items[0].url : games[i].editorialUrl
      games[i].editorialUrl = 'https://www.nhl.com/' + games[i].editorialUrl

    }
    this.games(games)
    document.getElementById('gameHeader').style.display = ''
    document.getElementById('gameList').style.display = ''
    document.getElementById('loading').style.display = 'none'
  };
  this.getDefaultFeed = function (items) {
    return items[0].mediaPlaybackId
  };
  this.formatUrl = function (urlStr, params) {
    return urlStr + '?' + new URLSearchParams(params).toString()
  };

  this.corsRequest = function (options, printResult) {
    var cors_api_url = 'https://cors-anywhere.herokuapp.com/';

    var x = new XMLHttpRequest();
    x.open(options.method, cors_api_url + options.url);
    x.onload = x.onerror = function () {
      console.log(x.responseText)
    };
    x.send(options.data);
  }

  this.playFeed = async function (e) {
    var self = this;
    //e.preventDefault()
    if (!e.url) {
      // const url = viewModel.formatUrl('https://cors-anywhere.herokuapp.com/http://nhl.freegamez.ga/getM3U8.php', {
      //   league: 'nhl',
      //   date: viewModel.scheduleDateParam(),
      //   id: e.mediaPlaybackId,
      //   cdn: 'akc'
      // })
      const url = 'https://www.responsivepaper.com/media-url?date=' + viewModel.scheduleDateParam() + "&id=" + e.mediaPlaybackId + "&cdn=l3c"
      const response = await fetch(url, { mode: 'cors' })
      //const response = viewModel.corsRequest({ method: 'GET', url })
      if (response.status != 200) {
        alert('Error requesting feed: ' + response.status)
        return
      }
      const feedUrl = await response.text()
      if (feedUrl.substring(0, 3) == 'Not') {
        alert(feedUrl)
        return
      }
      e.url = feedUrl
    }
    if (viewModel.currentPlaybackId) {
      viewModel.playbackCache[viewModel.currentPlaybackId] = viewModel.status().currentTime
    }
    //if live start at 50 minutes from start of live feed
    playerProxy.load(e.url, viewModel.playbackCache[e.mediaPlaybackId] ? viewModel.playbackCache[e.mediaPlaybackId] : (e.mediaState == 'MEDIA_ON' ? 3600 : 0))
    viewModel.currentPlaybackId = e.mediaPlaybackId;
    viewModel.currentGame = e
    window.localStorage.setItem('playbackCache', JSON.stringify(viewModel.playbackCache));

  };
  this.getGame = async function (id) {
    const response = await fetch(this.baseUrl + 'game/' + id + '/content')
    return await response.json()
  };
  this.getSchedule = async function () {
    const response = await fetch(this.baseUrl + 'schedule?date=' + this.scheduleDateParam())
    return await response.json()
  };
  this.setAvsSchedule = async function () {
    const response = await fetch(this.baseUrl + 'schedule?teamId=21&startDate=2019-10-01&endDate=2020-05-01')
    const games = await response.json()
    this.avsGames = games.dates.map(d => {
      return {
        date: d.date,
        away: {
          score: d.games[0].teams.away.score,
          teamId: d.games[0].teams.away.team.id,
          name: d.games[0].teams.away.team.name
        },
        home: {
          score: d.games[0].teams.home.score,
          teamId: d.games[0].teams.home.team.id,
          name: d.games[0].teams.home.team.name

        }
      }
    })
  };
}
var viewModel = new ViewModel()
ko.applyBindings(viewModel)
viewModel.init()



