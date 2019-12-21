const { exec, spawn } = require('child_process')
const execAsync = function (cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}
const spawnAsync = function (cmd, args) {
  return new Promise((resolve, reject) => {
    const ps = spawn(cmd, args)
    resolve(ps.stdout ? ps.stdout : ps.stderr)

  });

}
module.exports = { spawnAsync, execAsync }
