# Deployment

## GitHub Pages Deployment

This project is configured with an automated workflow to deploy to GitHub Pages.

### Configuration Steps

1. Push your code to a GitHub repository
2. Enable GitHub Pages functionality in your GitHub repository
3. Ensure GitHub Actions is enabled (enabled by default)

### Workflow File

The `.github/workflows/deploy.yml` file in the project root contains the complete deployment configuration:

- Automatically triggered when pushing to `main` or `master` branches
- Builds using Ubuntu environment
- Installs pnpm and project dependencies
- Executes `pnpm docs:build` to build static files
- Deploys to GitHub Pages

### Base Path Configuration

The current `base` path is configured as `/`, corresponding to the repository name. If you change the repository name, please update the `base` configuration in `docs/.vuepress/config.ts` accordingly.

### Manual Deployment

If you need to deploy manually from your local machine, you can run:

```bash
pnpm docs:deploy
```

This will build the site and deploy the output to GitHub Pages.