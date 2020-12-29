const core = require('@actions/core');
const github = require('@actions/github');

async function getBug(octokit, pr) {
  const { body } = pr;
  const match = body.match(/^bug:\s*#(\d+)\s*$/m);
  if (!match) {
    return null;
  }

  const resp = await octokit.issues.get({
    owner: core.getInput('owner'),
    repo: core.getInput('repo'),
    issue_number: match[1],
  });

  return resp.data;
}

async function run() {
  const { action } = github.context.payload;
  const pr = github.context.payload.pull_request;
  const octokit = github.getOctokit(core.getInput('github-token'));

  const bug = await getBug(octokit, pr);
  const label_merged = core.getInput('label-merged');
  if (bug) {
    core.info(`Found related bug: #${bug.number}.`);
    if (action === 'opened' || action === 'reopened') {
      core.info(`Creating comment to PR #${pr.number}.`);
      await octokit.issues.createComment({
        owner: core.getInput('owner'),
        repo: core.getInput('repo'),
        issue_number: pr.number,
        body: `🐛 #${bug.number} will be marked as \`${label_merged}\` when merged 🎉.`,
      });
    } else if (action == 'closed' && pr.merged) {
      core.info(`PR #${pr.number} is merged.`);
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
