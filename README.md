# Roadblock

A Node.js application for collecting Github statistics into a _SQLite or PostgreSQL_ database.

This project was built with simplicity and ease of use in mind. We simply wanted GitHub data in a relational database which we could then create visualisations for using Metabase (https://www.metabase.com/).


## Installing and using
Install from npm as a global command
```
  > npm i @zalando/roadblock -g
```

Run the roadblock command in an empty folder
```
  > roadblock
```

This will generate a basic `roadblock.json` file which you can then modify:

```
{
    "github": {
        "token": "xxx",
        "url" : "https://internal.gith.ub/api/v3" 
    },
    "tasks": [
        "pre/*", "org/*", "repo/releases"
    ],
    "orgs": [
        "My-Org", "Second-org"
    ]
}
```

**Github.token** a [github token](https://github.com/settings/tokens/new) is required to access most data - ensure that the token have read access to `repo`, `repo:status`, `public_repo`, `read:org`, `read:user`, `read:discussion`.

**url** is only required if you want to collect data from Github Enterprise.

**Tasks** Specify what data you want to collect, by default it is set to * which means
run all possible tasks.
Either use wildcards like `*` or `org/*` or set to 
specific tasks like `repo/issues` or ignore specific tasks with `!repo/profiles`

**Orgs** By default roadblock will attempt to collect from all orgs, which the token 
have access to, to filter or to query additional orgs, set them here.

Use either: `*` `orgname` or `!orgname`.


#### Configuration as arguments
Configuration values can also be passed from the command line to avoid storing tokens in 
clear text:

```
> roadblock github.token=YOURTOKEN

> roadblock orgs=["zalando","custom"]
```

### Output
Script will run between 10 and 20 minutes and store collected data in a SQLite datase - you can also configure a postgres instance if needed.

Sqlite Database and json summaries will be stored in the folder where the `roadblock` is invoked.

## Included tasks
The task system in roadblock divides the different data collection tasks into 4 seperate phases. 

#### [Pre](tasks/pre)
Tasks to collect initial data points, default is to collect configured organisations

- `pre/organisations` - Collects available organisations from the user and configured orgs
- `pre/calendar` - Creates a calendar table with years and months, helpful when querying data

#### [Org](tasks/org)
Tasks run for each seperate organisation, each task is passed an organisation object to process data based on. 

- `org/members` - collect all members of the organisations
- `org/repository` - collect all public, non-fork repositories on the organisation
- `org/vulnerabilities` - collect all security alerts from all repositories on the organisation
  
#### [Repo](tasks/repo)
Tasks run for each collected repository. 

- `repo/collaborators` - Collect all collaborators on a repository
- `repo/commits` - Collect all repository commits
- `repo/contributions` - Collect all contributions (summarised changes)
- `repo/issues` - Collect all issues on the repositories
- `repo/profiles` - Repository health / community profile
- `repo/pullrequests` - Repository pull requests
- `repo/releases` - All releases on repository
- `repo/topics` - Repository topics       

#### [Post](tasks/post)
Tasks to run after all org and repo data collection is completed

- `post/export` - Export organisation and repository stats to json files
- `post/upstream` - Collect upstream contribution stats from external repositories.


## Using the source
```
> Clone this project to your local machine
> git clone https://github.com/zalando-incubator/roadblock.git
> cd roadblock

> Run npm install and start collecting data
> npm install

```

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
