# Roadblock

A Node.js application for pulling Github organisation statistics into a _SQLite or PostgreSQL_ database.

This project was built with simplicity and ease of use in mind. We simply wanted GitHub data in a relational database which we could then create visualisations for using Metabase (https://www.metabase.com/).

There are other projects out there like [GhCrawler](https://github.com/Microsoft/ghcrawler) which collect and handle much more detailed GitHub data than this project, that is not our focus.

### Data collected by Roadblock

Roadblock automatically collects all data from all the organisations which the token user has a public membership of, so there is no configuration of which organisations to collect from.

When Roadblock runs, it will collect:

- Organisations
- Repositories
- Members of organisations
- Pull Requests
- Commits
- Issues
- Community Profiles
- External contributions
- Topics

## Getting Started

These instructions will help you get a copy of the project up and running on your local machine for development and testing purposes.

To run, you must have a Github token setup, you can setup a new token here: https://github.com/settings/tokens. Token needs access to **repo, read:org, read:user and user:email.**

You can also pass in a list of orgs which it should specifically query, it will only attempt to 
do so if the token gives the user access to this. 

```
> Clone this project to your local machine

> npm install
> npm start [GITHUBTOKEN] [ORG,ORG] [TYPE,TYPE]
```

- ORG can be left blank or can be a commaseperated string of orgs to index
- TYPE can be left blank or be a commaseparated string of the following:
  - members
  - contributions
  - pullrequests
  - commits
  - collaborators
  - issues
  - profiles
  - upstream

Both ORG and TYPE can also use negative filters so "!topics,*" will collect all repository data except topics
"!zalando,!stups,*" will go through all organisations that the profile have access to, except zalando and stups.

> script will run between 10 and 20 minutes and store collected data in either the default SQLite database or in a SQLite database you configure.

Database and json summaries will be stored in the /data folder

### Pre Requisites

What software you need to install:

- Node.js
- [Metabase](https://www.metabase.com/) (optional) - to visualise the collected data

## Built With

* [Sequelize](http://docs.sequelizejs.com/) - Node.js ORM
* [GhRequestor](https://github.com/Microsoft/ghrequestor) - Github client for fetching large amounts of data

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
