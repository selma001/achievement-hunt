#!/usr/bin/env node
// Check how close a GitHub user is to the main profile achievements.
// Usage: node check.mjs <username>
// Optional: set GITHUB_TOKEN to raise the API rate limit (60 -> 5000 requests/hour).

import { TIERS, tier, tierIndex, isQuickdraw } from "./lib.mjs";

const HELP = `Usage: node check.mjs <username> [options]

Shows how close a GitHub user is to earning profile achievements.

Options:
  --json       Print results as JSON (tier: -1 none, 0 base, 1-3 x2-x4)
  -h, --help   Show this help

Environment:
  GITHUB_TOKEN  Token used for API requests (raises the rate limit)`;

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) {
  console.log(HELP);
  process.exit(0);
}
const json = args.includes("--json");
const user = args.find((a) => !a.startsWith("-"));
if (!user) {
  console.error(HELP);
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "achievement-hunt",
  ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
};

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 403 || res.status === 429) {
    throw new Error("GitHub API rate limit reached. Set GITHUB_TOKEN and try again.");
  }
  if (res.status === 404 && path.startsWith("/users/") && !path.includes("/repos")) {
    throw new Error(`GitHub user "${user}" not found.`);
  }
  if (!res.ok) throw new Error(`GitHub API ${res.status} on ${path}`);
  return res.json();
}

// GraphQL is only available with a token. Returns null when no token is set.
async function graphql(query, variables) {
  if (!process.env.GITHUB_TOKEN) return null;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
  const body = await res.json();
  if (body.errors) throw new Error(`GitHub GraphQL: ${body.errors[0].message}`);
  return body.data;
}

const mark = (ok) => (ok ? "[x]" : "[ ]");

async function main() {
  await api(`/users/${encodeURIComponent(user)}`); // fails early if the user does not exist
  const q = (s) => encodeURIComponent(s);

  // Pull Shark: merged pull requests (any repo).
  const merged = await api(`/search/issues?q=${q(`type:pr author:${user} is:merged`)}&per_page=20&sort=created`);

  // Starstruck: stars on the user's most-starred repo.
  const repos = await api(`/users/${encodeURIComponent(user)}/repos?per_page=100&type=owner&sort=updated`);
  const top = repos.filter((r) => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
  const stars = top ? top.stargazers_count : 0;

  // Quickdraw: an issue or PR closed within 5 minutes of being opened (checks the 100 most recent).
  const closed = await api(`/search/issues?q=${q(`author:${user} is:closed`)}&per_page=100&sort=created`);
  const quick = closed.items.find(isQuickdraw);

  // YOLO: a merged PR with no review (checks the 20 most recent merged PRs).
  let yolo = null;
  for (const pr of merged.items) {
    const [, owner, repo] = pr.repository_url.match(/repos\/([^/]+)\/(.+)$/);
    const reviews = await api(`/repos/${owner}/${repo}/pulls/${pr.number}/reviews`);
    if (reviews.length === 0) { yolo = pr; break; }
  }

  // Galaxy Brain: accepted answers in Discussions (GraphQL, needs a token).
  const gql = await graphql(
    `query($login: String!) { user(login: $login) { repositoryDiscussionComments(onlyAnswers: true) { totalCount } } }`,
    { login: user },
  );
  const answers = gql ? gql.user.repositoryDiscussionComments.totalCount : null;

  if (json) {
    console.log(JSON.stringify({
      user,
      pullShark: { mergedPRs: merged.total_count, tier: tierIndex(merged.total_count, TIERS.pullShark) },
      starstruck: { stars, repo: top ? top.full_name : null, tier: tierIndex(stars, TIERS.starstruck) },
      quickdraw: { earned: !!quick, example: quick ? quick.html_url : null },
      yolo: { earned: !!yolo, example: yolo ? yolo.html_url : null },
      galaxyBrain: answers === null ? null : { acceptedAnswers: answers, tier: tierIndex(answers, TIERS.galaxyBrain) },
    }, null, 2));
    return;
  }

  console.log(`\nAchievement check for ${user}\n`);
  console.log(`${mark(merged.total_count >= 2)} Pull Shark   ${merged.total_count} merged PRs: ${tier(merged.total_count, TIERS.pullShark)}`);
  console.log(`${mark(stars >= 16)} Starstruck   ${stars} stars${top ? ` on ${top.name}` : ""}: ${tier(stars, TIERS.starstruck)}`);
  console.log(`${mark(!!quick)} Quickdraw    ${quick ? `${quick.html_url}` : "no fast close found in recent activity"}`);
  console.log(`${mark(!!yolo)} YOLO         ${yolo ? `${yolo.html_url}` : "no unreviewed merged PR found recently"}`);
  if (answers === null) {
    console.log(`[?] Galaxy Brain set GITHUB_TOKEN to check accepted Discussion answers`);
  } else {
    console.log(`${mark(answers >= 2)} Galaxy Brain ${answers} accepted answers: ${tier(answers, TIERS.galaxyBrain)}`);
  }
  console.log(`\nNot checked: Pair Extraordinaire, Public Sponsor.`);
  console.log(`See README.md for how to earn each one.\n`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
