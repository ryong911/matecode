# Packaging and Publishing the Chat-Code Apply Extension

This document provides step-by-step instructions on how to package and publish the Chat-Code Apply extension to the Visual Studio Code Marketplace.

## Prerequisites

Before packaging and publishing, ensure you have:

1. [Node.js](https://nodejs.org/) installed
2. [Visual Studio Code](https://code.visualstudio.com/) installed
3. [vsce](https://github.com/microsoft/vscode-vsce) installed globally:
   ```
   npm install -g vsce
   ```
4. A [Microsoft Azure DevOps](https://dev.azure.com/) account for publishing
5. A Personal Access Token (PAT) from Azure DevOps

## Version Management

1. Update the version in `package.json` following semantic versioning:
   - MAJOR: breaking changes
   - MINOR: new features, no breaking changes
   - PATCH: bug fixes, no breaking changes

2. Add release notes to the `CHANGELOG.md` file, describing the changes in the new version.

## Testing Before Packaging

1. Run the extension tests:
   ```
   npm test
   ```

2. Manually test the extension by launching a debugging session (F5 in VS Code).

3. Ensure all files mentioned in the `.vscodeignore` file are properly excluded.

## Packaging the Extension

1. Generate a `.vsix` file:
   ```
   vsce package
   ```

2. The command will create a file named `chat-code-apply-x.y.z.vsix` where `x.y.z` is the version number from your `package.json`.

3. Test the packaged extension by installing it manually in VS Code:
   - Open VS Code
   - Go to Extensions view
   - Click the "..." menu in the top-right
   - Select "Install from VSIX..."
   - Choose the generated `.vsix` file

## Publishing to VS Code Marketplace

### First Time Setup

1. Create a publisher on the [VS Code Marketplace](https://marketplace.visualstudio.com/VSCode):
   - Sign in with your Azure DevOps account
   - Create a publisher if you don't have one

2. Create a Personal Access Token (PAT) in Azure DevOps:
   - Go to your Azure DevOps profile settings
   - Select "Personal Access Tokens"
   - Create a new token with "Marketplace (publish)" scope
   - Save this token securely

3. Log in to vsce with your publisher ID and PAT:
   ```
   vsce login <your-publisher-id>
   ```

### Publishing

1. Publish your extension:
   ```
   vsce publish
   ```

2. For minor/patch updates, you can also use:
   ```
   vsce publish minor
   ```
   or
   ```
   vsce publish patch
   ```

3. Verify your extension appears on the [VS Code Marketplace](https://marketplace.visualstudio.com/VSCode)

## Updating the Extension

1. Make your changes to the codebase
2. Update version in `package.json`
3. Update `CHANGELOG.md`
4. Package and test locally
5. Publish the update using `vsce publish`

## Unpublishing

If needed, you can unpublish a specific version or the entire extension:

1. Unpublish a specific version:
   ```
   vsce unpublish <publisher>.<extension>@<version>
   ```

2. Unpublish the entire extension:
   ```
   vsce unpublish <publisher>.<extension>
   ```

## Automating Releases with GitHub Actions

Consider setting up a GitHub Actions workflow to automate the release process:

1. Create a `.github/workflows/publish.yml` file in your repository
2. Set up a workflow that runs tests and publishes the extension on release tags
3. Store your PAT as a GitHub secret

Example workflow file:
```yaml
name: Publish Extension

on:
  release:
    types: [created]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          node-version: 16
      - run: npm ci
      - run: npm test

  publish:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          node-version: 16
      - run: npm ci
      - name: Publish to VS Code Marketplace
        run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
```

## Resources

- [VS Code Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce CLI Documentation](https://github.com/microsoft/vscode-vsce)
- [VS Code Extension Marketplace](https://marketplace.visualstudio.com/vscode)
