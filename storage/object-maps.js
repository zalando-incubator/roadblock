module.exports = {
  memberMap: {
    id: 'id',
    avatar_url: 'avatar',
    html_url: 'url',
    login: 'login'
  },

  orgMap: {
    id: 'id',
    login: 'name',
    avatar_url: 'avatar',
    created_at: 'created_at',
    follows: 'followers',
    following: 'following',
    collaborators: 'collaborators',
    total_private_repos: 'private_repositories',
    public_repos: 'public_repositories'
  },

  issueMap: {
    id: 'id',
    title: 'title',
    state: 'state',
    url: 'url',
    'assignee.id': 'assignee_id',
    'user.id': 'user_id',
    closed_at: 'closed_at',
    updated_at: 'updated_at',
    created_at: 'created_at',
    comments: 'comments',
    'repository.id': 'repository_id',
    'pull_request.html_url': 'pull_request'
  },

  pullRequestMap: {
    id: 'id',
    title: 'title',
    state: 'state',
    html_url: 'url',
    closed_at: 'closed_at',
    updated_at: 'updated_at',
    created_at: 'created_at',
    merged_at: 'merged_at',
    author_association: 'author_association',
    'assignee.id': 'assignee_id',
    'user.id': 'user_id',
    'base.repo.id': 'repository_id',
    'head.repo.id': 'pull_request_repository_id'
  },

  repoMap: {
    id: 'id',
    name: 'name',
    description: 'description',
    full_name: 'full_name',
    language: 'language',
    created_at: 'created_at',
    updated_at: 'updated_at',
    forks_count: 'forks',
    stargazers_count: 'stars',
    open_issues_count: 'open_issues',
    watchers_count: 'watchers',
    'owner.id': 'organisation_id'
  },

  commitMap: {
    id: 'id',
    'commit.message': 'message',
    'author.id': 'author',
    'author.date': 'author_date',
    'committer.id': 'committer',
    'committer.date': 'committer_date',
    html_url: 'url',
    'commit.comment_count': 'comment_count'
  },

  collaboratorMap: {
    id: 'user_id',
    avatar_url: 'avatar',
    html_url: 'url',
    login: 'login',
    'permissions.push': 'push',
    'permissions.pull': 'pull',
    'permissions.admin': 'admin'
  },

  contributionMap: {
    'author.id': 'user_id',
    total: 'total',
    'author.login': 'login'
  },

  externalContributionMap: {
    id: 'id',
    total: 'total',
    'author.id': 'member_id',
    'author.login': 'login',
    'author.html_url': 'url'
  },

  communityProfileMap: {
    id: 'id',
    health_percentage: 'health_percentage',
    description: 'description',
    documentation: 'documentation',
    'files.code_of_conduct': {
      key: 'code_of_conduct',
      transform: file => {
        return file ? true : false;
      }
    },
    'files.contributing': {
      key: 'contributing',
      transform: file => {
        return file ? true : false;
      }
    },
    'files.issue_template': {
      key: 'issue_template',
      transform: file => {
        return file ? true : false;
      }
    },
    'files.pull_request_template': {
      key: 'pull_request_template',
      transform: file => {
        return file ? true : false;
      }
    },
    'files.readme': {
      key: 'readme',
      transform: file => {
        return file ? true : false;
      }
    },
    'files.license': {
      key: 'license',
      transform: file => {
        return file ? file.name : '';
      }
    }
  }
};
