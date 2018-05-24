const mapper = require('object-mapper');
const maps = require('./object-maps');

let _models;

function init(schema) {
  _models = schema;

  return {
    writeMembers,
    writeIssues,
    writeOrganisations,
    writeSingleOrganisation,
    writeRepositories,
    writePullRequests,
    writeCommits,
    writeCommunityProfile,
    writeExternalContributions
  };
}

module.exports = { init };

/*
*
* Module for bulk writing collections of github entities to the db
*
*/

function arrayMapper(type, param) {
  const arr = Array.isArray(param) ? param : [1].fill(param);

  return arr.map(x => {
    return mapper(x, maps[`${type}Map`]);
  });
}

async function writeCommunityProfile(profile, repoId) {
  const dbProfile = mapper(profile, maps.communityProfileMap);
  const dbProfileWithRepo = {
    ...dbProfile,
    repository_id: repoId
  };

  try {
    await _models.CommunityProfile.create(dbProfileWithRepo);
  } catch (e) {
    return new Error(e);
  }
}

async function writeCommits(commits, repoId) {
  const dbCommits = arrayMapper('commit', commits);
  const dbCommitsWithRepo = dbCommits.map(x => {
    return {
      ...x,
      repository_id: repoId
    };
  });

  try {
    return await _models.Commit.bulkCreate(dbCommitsWithRepo);
  } catch (e) {
    return new Error(e);
  }
}

async function writePullRequests(prs) {
  const dbPrs = arrayMapper('pullRequest', prs);

  try {
    return await _models.PullRequest.bulkCreate(dbPrs);
  } catch (e) {
    return new Error(e);
  }
}

async function writeRepositories(repos) {
  const dbRepos = arrayMapper('repo', repos);

  try {
    return await _models.Repository.bulkCreate(dbRepos);
  } catch (e) {
    return new Error(e);
  }
}

async function writeOrganisations(orgs) {
  const dbOrgs = arrayMapper('org', orgs);

  try {
    return await _models.Organisation.bulkCreate(dbOrgs);
  } catch (e) {
    return new Error(e);
  }
}

async function writeSingleOrganisation(organisation) {
  const dbOrg = mapper(organisation, maps.orgMap);

  try {
    return await _models.Organisation.create(dbOrg);
  } catch (e) {
    return new Error(e);
  }
}

async function writeMembers(members, organisation) {
  const dbMembers = arrayMapper('member', members);

  try {
    for (const member of dbMembers) {
      await _models.Member.findOrCreate({ where: member }).spread(
        (createdMember) => {
          return organisation.addMember(createdMember);
        }
      );
    }
  } catch (e) {
    return new Error(e);
  }
}

async function writeIssues(issues) {
  const dbIssues = arrayMapper('issue', issues);

  try {
    return await _models.Issue.bulkCreate(dbIssues);
  } catch (e) {
    return new Error(e);
  }
}

async function writeExternalContributions(contributors, members) {
  const filteredArray  = contributors.filter(contributor => {
    return members.filter(member => {
      return member.login === contributor.author.login;
    }).length === 0;
  });
  console.log('filteredArray', filteredArray);
  const dbExternalContributions = arrayMapper('externalContribution', contributors);
  console.log('contrib', dbExternalContributions[0]);

  try {
    const c = await _models.ExternalContribution.bulkCreate(dbExternalContributions);
    console.log('created', c);
    return c;
  } catch (e) {
    return new Error(e);
  }
}
