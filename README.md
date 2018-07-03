# Truck Backer Upper

This repository contains the neural network and perceptron demonstration program for the lecture “Neural Networks” at the [Interactive Systems Lab (ISL)](http://isl.anthropomatik.kit.edu/english/) at the [Karlsruhe Institute of Technology](https://kit.edu).

This demo runs completely client-side in the browser. The `index.html` file in the `gh-pages` branch can be opened on a local webserver (`python3 -m http.server`). [A hosted version is available here](https://tifu.github.io/truck_backer_upper/).

## Development

This project is written in [TypeScript](http://www.typescriptlang.org/), a statically typed superset of JavaScript.

I recommend [Visual Studio Code](https://code.visualstudio.com/) (crossplatform and opensource) for development.
An alternative is [Atom](https://atom.io/) + [atom-typescript](https://atom.io/packages/atom-typescript).


[React](https://facebook.github.io/react/) is used with [JSX](https://facebook.github.io/jsx/) for GUI state handling.

## Setup

```bash
git checkout gh-pages # to set upstream
git checkout master
git worktree add bin gh-pages
npm install
```

Then build via ```npm run build``` or ```npm run prod-build```

## Updating binaries

Use `cd bin; git add -A; git commit -m'update binaries'; git push` to update the binaries.
