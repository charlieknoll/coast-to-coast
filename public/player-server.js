var playerProxy = {
  exec: async function (action) {
    const response = await fetch(window.location.origin + '/player/' + action)
    if (response.status != 200) console.log('Error occurred on action: ' + action)
  },
  load: async function (url, t) {
    const response = await fetch(window.location.origin + '/player/resume?t=' + t + '&url=' + url)
    if (response.status != 200) console.log('Error occurred on load: ' + url)
  },
  getStatus: async function () {
    const response = await fetch(window.location.origin + '/player/status')
    if (response.status != 200) console.log('Error occurred on getting status')
    return await response.json();
    //return time.replace('time:', ''); //I had to do this because express was interpreting the numeric time as a status code
  }
}