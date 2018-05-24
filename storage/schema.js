const Sequelize = require('sequelize');

module.exports = {
  Commit: {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true
    },
    author: Sequelize.BIGINT,
    author_date: Sequelize.DATE,
    committer: Sequelize.BIGINT,
    committer_date: Sequelize.DATE,
    url: Sequelize.STRING,
    message: Sequelize.STRING,
    comment_count: Sequelize.INTEGER
  },

  Issue: {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true
    },
    title: Sequelize.STRING(600),
    state: Sequelize.STRING,
    url: Sequelize.STRING(600),
    assignee_id: Sequelize.BIGINT,
    user_id: Sequelize.BIGINT,
    closed_at: Sequelize.DATE,
    updated_at: Sequelize.DATE,
    comments: Sequelize.INTEGER,
    created_at: Sequelize.DATE,
    pull_request: Sequelize.STRING(400)
  },

  Member: {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true
    },
    avatar: Sequelize.STRING(400),
    login: Sequelize.STRING(100),
    url: Sequelize.STRING
  },

  Organisation: {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true
    },
    name: Sequelize.STRING(600),
    avatar: Sequelize.STRING,
    created_at: Sequelize.DATE,
    followers: Sequelize.INTEGER,
    following: Sequelize.INTEGER,
    collaborators: Sequelize.INTEGER,
    public_repositories: Sequelize.INTEGER,
    private_repositories: Sequelize.INTEGER
  },

  Repository: {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true
    },
    name: Sequelize.STRING,
    description: Sequelize.STRING,
    full_name: Sequelize.STRING,
    language: Sequelize.STRING,
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE,
    stars: Sequelize.INTEGER,
    forks: Sequelize.INTEGER,
    open_issues: Sequelize.INTEGER,
    watchers: Sequelize.INTEGER
  },

  PullRequest: {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true
    },
    closed_at: Sequelize.DATE,
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE,
    merged_at: Sequelize.DATE,
    url: Sequelize.STRING,
    title: Sequelize.STRING,
    state: Sequelize.STRING,
    pull_request_repository_id: Sequelize.BIGINT,
    author_association: Sequelize.STRING,
    assignee_id: Sequelize.BIGINT,
    user_id: Sequelize.BIGINT
  },

  CommunityProfile: {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true
    },
    health_percentage: Sequelize.INTEGER,
    description: Sequelize.STRING,
    documentation: Sequelize.STRING,
    code_of_conduct: Sequelize.BOOLEAN,
    contributing: Sequelize.BOOLEAN,
    issue_template: Sequelize.BOOLEAN,
    pull_request_template: Sequelize.BOOLEAN,
    readme: Sequelize.BOOLEAN,
    license: Sequelize.STRING
  }
};
