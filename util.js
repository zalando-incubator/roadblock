const fs = require('fs');
var path = require('path');

const { performance } = require('perf_hooks');

const barlogger = function() {
  const result = {};
  result.log = () => {
    process.stdout.write('.');
  };
  return result;
};

const runTask = function(task, filter) {
  if (filter.indexOf(`!${task}`) > -1) return false;
  if (filter === '*' || filter.indexOf('*') > -1 || filter.indexOf(task) > -1)
    return true;

  return false;
};

const timePassed = function(startTime) {
  var duration = performance.now() - startTime;

  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;

  console.log(
    `  ⏱   Time passed: ${hours}:${minutes}:${seconds}.${milliseconds}`
  );
};

var getTasks = function(dir, filter) {
  var tasks = [];
  var globalPath = __dirname + '/tasks/' + dir + '/';
  var localPath = process.cwd() + '/' + dir + '/';

  var allowTask = function(filename) {
    var key = (dir + '/' + filename.replace('.js', '')).toLowerCase();

    if (filter.indexOf(`!${dir}/*`) > -1) return false;
    if (filter.indexOf(`!${key}`) > -1) return false;

    if (
      filter.indexOf('*') > -1 ||
      filter.indexOf(key) > -1 ||
      filter.indexOf(dir + '/*') > -1
    )
      return true;
  };

  if (fs.existsSync(globalPath)) {
    for (const file of fs.readdirSync(globalPath)) {
      if (allowTask(file)) tasks.push(globalPath + file);
    }
  }
  if (fs.existsSync(localPath)) {
    for (const file of fs.readdirSync(localPath)) {
      if (allowTask(file)) tasks.push(localPath + file);
    }
  }

  return tasks;
};

var getClients = function() {
  var tasks = [];
  var localPath = process.cwd() + '/client/';

  if (fs.existsSync(localPath)) {
    for (const file of fs
      .readdirSync(localPath)
      .filter(x => path.extname(x) === '.js')) {
      tasks.push(localPath + file);
    }
  }

  return tasks;
};

const minimalConfig = {
  github: {
    token: ''
  },

  tasks: ['*'],
  orgs: ['*']
};

// default config
const defaultConfig = {
  github: {
    token: '',
    url: 'https://api.github.com'
  },

  tasks: ['*'],
  orgs: ['*'],

  db: {
    database: 'roadblock',
    dialect: 'sqlite',
    storage: './roadblock.sqlite',
    host: 'localhost'
  },

  export: {
    storage: './'
  },

  externalProjects: []
};

module.exports = {
  barlogger,
  runTask,
  getTasks,
  getClients,
  timePassed,
  defaultConfig,
  minimalConfig
};
