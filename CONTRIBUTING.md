# Contributing

Thanks for helping out.

## Reporting a problem

Open an issue with the command you ran, what you expected and what you got. If a tier threshold in the README is out of date, link to where you saw the current value.

## Making a change

1. Fork the repository and create a branch.
2. Keep `check.mjs` dependency-free: Node.js built-ins only.
3. Put logic that can be tested without the network in `lib.mjs` and add a test in `test/`.
4. Run `npm test` before opening a pull request.
