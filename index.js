const core = require('@actions/core');
const github = require('@actions/github');

async function getBugs(octokit, pr) {
  const { body } = pr;
  const matches = body.matchAll(/^bug:\s*(#(\d+)[,\s]*)+$/gm);
  const bugs = [];
  const visited = new Set();

  for (const match of matches) {
    const subMatches = match[0].matchAll(/#(\d+)/gm);
    for (const subMatch of subMatches) {
      const bugId = subMatch[1];
      if (visited.has(bugId)) {
        continue;
      }

      const resp = await octokit.issues.get({
        owner: core.getInput('owner'),
        repo: core.getInput('repo'),
        issue_number: bugId,
      });

      bugs.push(resp.data);
      visited.add(bugId);
    }
  }

  return bugs;
}

async function run() {
  const { action } = github.context.payload;
  const pr = github.context.payload.pull_request;
  const octokit = github.getOctokit(core.getInput('github-token'));

  const bugs = await getBugs(octokit, pr);
  const label_merged = core.getInput('label-merged');

  if (!bugs || bugs.length === 0) {
    return;
  }

  for (const bug of bugs) {
    core.info(`Found related bug: #${bug.number}.`);
  }

  if (action === 'opened' || action === 'edited') {
    core.info(`PR #${pr.number} is ${action}.`);

    const bug_list = bugs.map((b) => `#${b.number}`).join(', ');
    const resp = await octokit.issues.listComments({
      owner: core.getInput('owner'),
      repo: core.getInput('repo'),
      issue_number: pr.number,
    });

    const comment = resp.data.find(
      (x) => x.user.type === 'Bot' && x.body.startsWith('🐛')
    );
    if (comment) {
      core.info(`Updating comment ${comment.id} to PR #${pr.number}.`);

      await octokit.issues.updateComment({
        owner: core.getInput('owner'),
        repo: core.getInput('repo'),
        issue_number: pr.number,
        comment_id: comment.id,
        body: `🐛 ${bug_list} will be marked as \`${label_merged}\` when merged 🎉.`,
      });
    } else {
      core.info(`Creating comment to PR #${pr.number}.`);

      await octokit.issues.createComment({
        owner: core.getInput('owner'),
        repo: core.getInput('repo'),
        issue_number: pr.number,
        body: `🐛 ${bug_list} will be marked as \`${label_merged}\` when merged 🎉.`,
      });
    }
  } else if (action == 'closed' && pr.merged) {
    core.info(`PR #${pr.number} is merged.`);
    for (const bug of bugs) {
      if (!bug.labels.includes(label_merged)) {
        core.info(`Adding label ${label_merged} to bug #${bug.number}.`);
        await octokit.issues.addLabels({
          owner: core.getInput('owner'),
          repo: core.getInput('repo'),
          issue_number: bug.number,
          labels: [label_merged],
        });
      }
    }
  }
}

run();
