#!/usr/bin/env node
// Check how close a GitHub user is to the main profile achievements.
// Usage: node check.mjs <username>
// Optional: set GITHUB_TOKEN to raise the API rate limit (60 -> 5000 requests/hour).

const user = process.argv[2];
if (!user) {
  console.error("Usage: node check.mjs <username>");
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

function tier(value, steps) {
  const names = ["Bronze", "Silver", "Gold"];
  let reached = -1;
  steps.forEach((s, i) => { if (value >= s) reached = i; });
  const label = reached === -1 ? "not yet" : reached === 0 ? "Base" : `x${reached + 1} (${names[reached - 1]})`;
  const next = steps[reached + 1];
  return next ? `${label}, next at ${next}` : `${label}, max tier`;
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
  const quick = closed.items.find((i) => new Date(i.closed_at) - new Date(i.created_at) <= 5 * 60 * 1000);

  // YOLO: a merged PR with no review (checks the 20 most recent merged PRs).
  let yolo = null;
  for (const pr of merged.items) {
    const [, owner, repo] = pr.repository_url.match(/repos\/([^/]+)\/(.+)$/);
    const reviews = await api(`/repos/${owner}/${repo}/pulls/${pr.number}/reviews`);
    if (reviews.length === 0) { yolo = pr; break; }
  }

  console.log(`\nAchievement check for ${user}\n`);
  console.log(`${mark(merged.total_count >= 2)} Pull Shark   ${merged.total_count} merged PRs: ${tier(merged.total_count, [2, 16, 128, 1024])}`);
  console.log(`${mark(stars >= 16)} Starstruck   ${stars} stars${top ? ` on ${top.name}` : ""}: ${tier(stars, [16, 128, 512, 4096])}`);
  console.log(`${mark(!!quick)} Quickdraw    ${quick ? `${quick.html_url}` : "no fast close found in recent activity"}`);
  console.log(`${mark(!!yolo)} YOLO         ${yolo ? `${yolo.html_url}` : "no unreviewed merged PR found recently"}`);
  console.log(`\nNot checkable through the public REST API: Pair Extraordinaire, Galaxy Brain, Public Sponsor.`);
  console.log(`See README.md for how to earn each one.\n`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
