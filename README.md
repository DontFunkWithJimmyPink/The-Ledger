# The-Ledger

## `@github/spec-kit` Setup

This project uses [`@github/spec-kit`](https://github.com/github/spec-kit), which is hosted on [GitHub Packages](https://docs.github.com/en/packages).

### Prerequisites

You need a GitHub **Personal Access Token (PAT)** with at minimum the `read:packages` scope to install packages from GitHub Packages.

### Local development

1. [Create a classic PAT](https://github.com/settings/tokens) with `read:packages` scope.
2. Export it in your shell:

   ```sh
   export GITHUB_TOKEN=<your-pat>
   ```

3. Install dependencies:

   ```sh
   npm install
   ```

### GitHub Actions

In GitHub Actions workflows, the default `GITHUB_TOKEN` secret can be used directly — no extra setup required as long as the package visibility allows it:

```yaml
- name: Install dependencies
  run: npm install
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Import example

```js
const specKit = require("@github/spec-kit");
```

See [`src/index.js`](src/index.js) for the reference import used in this project.
