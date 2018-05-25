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
    writeCollaborators,
    writeContributions,
    writeExternalContributions,
    deleteExternalContributions
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

async function writeCollaborators(collaborators, repoId) {
  const dbCollaborators = arrayMapper('collaborator', collaborators);
  const dbCollaboratorsWithRepo = dbCollaborators.map(x => {
    return {
      ...x,
      repository_id: repoId
    };
  });

  try {
    return await _models.Collaborator.bulkCreate(dbCollaboratorsWithRepo);
  } catch (e) {
    return new Error(e);
  }
}

async function writeContributions(contributions, repoId) {
  const dbContributions = arrayMapper('contribution', contributions);
  const dbContributionsWithRepo = dbContributions.map(x => {
    return {
      ...x,
      repository_id: repoId
    };
  });

  try {
    return await _models.Contribution.bulkCreate(dbContributionsWithRepo);
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
    throw new Error(e);
  }
}

async function writeMembers(members, organisation) {
  const dbMembers = arrayMapper('member', members);

  try {
    for (const member of dbMembers) {
      await _models.Member.findOrCreate({ where: member }).spread(
        createdMember => {
          return organisation.addMember(createdMember);
        }
      );
    }
  } catch (e) {
    return new Error('Could not store members', e);
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

async function writeExternalContributions(contributors, repo) {
  const dbContributors = arrayMapper('externalContribution', contributors);
  const dbContributorsWithRepo = dbContributors.map(contributor => {
    return {
      ...contributor,
      repository_name: repo
    };
  });

  try {
    return await _models.ExternalContribution.bulkCreate(dbContributorsWithRepo);
  } catch (e) {
    return new Error(e);
  }
}

async function deleteExternalContributions(sequelize) {
  try {
    return await sequelize.query(`
      DELETE FROM ExternalContribution
      WHERE member_id IS NULL OR member_id NOT IN (
        SELECT id
        FROM Member
      )
    `);
  } catch (e) {
    return new Error(e);
  }
}
