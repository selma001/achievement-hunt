# achievement-hunt

A practical guide to GitHub profile achievements, plus a small script that checks how close any user is to earning them.

## Check your progress

Requires Node.js 18 or newer. No dependencies.

```bash
node check.mjs <github-username>
```

Example output:

```
Achievement check for octocat

[x] Pull Shark   3 merged PRs: Base, next at 16
[ ] Starstruck   4 stars on my-project: not yet, next at 16
[x] Quickdraw    https://github.com/octocat/demo/issues/1
[x] YOLO         https://github.com/octocat/demo/pull/2
```

Anonymous requests are limited to 60 per hour. If you hit the limit, pass a token:

```bash
GITHUB_TOKEN=$(gh auth token) node check.mjs <github-username>
```

## The achievements

Tiered achievements show a small badge on your profile: x2 (bronze), x3 (silver), x4 (gold).

| Achievement | How to earn it | Tiers (base / x2 / x3 / x4) |
|---|---|---|
| **Quickdraw** | Close an issue or pull request within 5 minutes of opening it. | one-time |
| **YOLO** | Merge a pull request without a code review. | one-time |
| **Pull Shark** | Get pull requests merged. | 2 / 16 / 128 / 1024 |
| **Pair Extraordinaire** | Co-author commits in merged pull requests (add a `Co-authored-by:` trailer with the other person's GitHub email). | 1 / 10 / 24 / 48 |
| **Starstruck** | Own a repository that other people star. | 16 / 128 / 512 / 4096 |
| **Galaxy Brain** | Have your answer marked as accepted in a GitHub Discussion. | 2 / 8 / 16 / 32 |
| **Public Sponsor** | Sponsor an open source contributor through GitHub Sponsors. | one-time |

### Retired achievements

These were awarded once and can no longer be earned:

- **Arctic Code Vault Contributor**: contributed code to a repository archived in the 2020 GitHub Archive Program.
- **Mars 2020 Contributor**: contributed to a repository used in the Mars 2020 Helicopter mission.

## Tips

- Badges only count public activity. Private repository contributions are hidden unless you turn on "Include private contributions on my profile".
- New badges can take a few hours to appear.
- The ones worth chasing are the ones that come from real work: answering questions in Discussions (Galaxy Brain), contributing fixes to projects you use (Pull Shark), and building something people want to star (Starstruck).

GitHub may add, rename or retire achievements. When in doubt, check your profile's Achievements section.

## License

MIT
