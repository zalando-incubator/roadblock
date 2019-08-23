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
    url: {
      git: 'https://github.com',
      api: 'https://api.github.com',
      raw: 'https://raw.githubusercontent.com'
    }
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
  defaultConfig,
  minimalConfig
};
