<<<<<<< HEAD
# n8n-nodes-infisical

[![npm version](https://img.shields.io/npm/v/n8n-nodes-infisical.svg)](https://www.npmjs.com/package/n8n-nodes-infisical)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is a community node for n8n that allows you to retrieve secrets from Infisical within your n8n workflows using the official Infisical SDK.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- **Direct Retrieval**: From version 1.0.3, uses `getSecret()` for direct secret retrieval instead of filtering for optimal performance
- **Official SDK**: Uses the official Infisical TypeScript SDK v4+ for reliable and maintained API access
- **Bearer Token Authentication**: Supports Access Token (Bearer) authentication for maximum security
- **Smart JSON**: Automatic JSON value parsing with common formatting error correction
- **Automatic Fallback**: If exact name isn't found, automatically tries common variations (uppercase, lowercase, suffixes)
- **Optimized Performance**: Direct single secret retrieval instead of downloading and filtering all secrets
- **Error Handling**: Robust error handling with intelligent fallback mechanisms

## Prerequisites

### Infisical Setup

1. **Infisical Account**: You need an account on [Infisical](https://infisical.com)
2. **Project**: A configured project in Infisical
3. **Access Token**: An access token with access to the necessary secrets

### n8n Setup

- **n8n version**: >= 1.0.0
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0

## Installation

### Method 1: Via n8n Community Nodes (Recommended)

1. **Open n8n** and go to **Settings** → **Community Nodes**
2. **Click** on "Install a community node"
3. **Enter** the package name: `n8n-nodes-infisical`
4. **Click** on "Install"
5. **Restart** n8n

### Method 2: Manual Installation

```bash
# Navigate to n8n directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-infisical

# Restart n8n
n8n start
```

### Method 3: Docker

Add to your `Dockerfile` or `docker-compose.yml`:

```dockerfile
# Dockerfile
FROM n8nio/n8n:latest
USER root
RUN npm install -g n8n-nodes-infisical
USER node
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_NODES_EXCLUDE=
      - EXTERNAL_FRONTEND_HOOKS_URLS=
    volumes:
      - ~/.n8n:/home/node/.n8n
    command: >
      sh -c "npm install n8n-nodes-infisical && n8n start"
```

## Configuration

### 1. Creating Access Token in Infisical

1. **Access** your Infisical dashboard
2. **Select** the project
3. **Go to** **Project Settings** → **Access Tokens**
4. **Click** on "Create access token"
5. **Configure**:
   - **Name**: e.g. "n8n-integration"
   - **Environment**: Select environment (dev, staging, prod)
   - **Secret Path**: `/` (or specific path)
   - **Permissions**: Read
6. **Copy** the generated token (starts with `eyJ`)

### 2. Credential Configuration in n8n

1. **Open** n8n and go to **Credentials**
2. **Click** on "Add credential"
3. **Search** and select "Infisical API"
4. **Fill** the fields:

| Field | Description | Example | Required |
|-------|-------------|---------|----------|
| **Site URL** | URL of your Infisical instance | `https://app.infisical.com` | X |
| **Access Token** | Infisical Access Token (Bearer) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ5...` | X |
| **Project ID** | Project ID (UUID) | `83d483a7-5187-43cb-a52b-1d930285bd4e` | X |
| **Environment Slug** | Environment slug | `dev`, `staging`, `prod` | X |

> **Note for version 1.0.3+**: We now use Access Token (Bearer) and Project ID (UUID) instead of the old Service Token and Project Slug for compatibility with Infisical SDK v4+.

5. **Click** on "Test connection" to verify
6. **Save** the credentials

## Usage

### Adding the Node to Workflow

1. **Open** your n8n workflow
2. **Click** on "Add node"
3. **Search** "Infisical"
4. **Select** the "Infisical" node
5. **Configure** the parameters

### Node Parameters

| Parameter | Type | Description | Default | Required |
|-----------|------|-------------|---------|----------|
| **Service Name** | String | Name of the service to retrieve credentials for | - | X |
| **Secret Path** | String | Path where secrets are stored | `/` |  |
| **Credential Mapping** | Array | Custom mappings | `[]` |  |

### Direct Retrieval (v1.0.3+)

The node now uses a **direct retrieval** approach for optimal performance:

1. **Direct Attempt**: Searches for the secret using exactly the specified `Service Name`
2. **Smart Fallback**: If exact name isn't found, automatically tries these variations:
   - Lowercase name: `servicename`
   - Uppercase name: `SERVICENAME`  
   - With account suffix: `servicename_account`, `SERVICENAME_ACCOUNT`
   - With config suffix: `servicename_config`, `SERVICENAME_CONFIG`
   - With credentials suffix: `servicename_credentials`, `SERVICENAME_CREDENTIALS`

### JSON Value Handling

The node intelligently handles JSON values:
- **Auto-parsing**: Automatically detects and parses JSON values
- **Error Correction**: Fixes common formatting errors (e.g. `{username"` → `{"username"`)
- **Flat Structure**: If the value is a JSON object, its properties become direct output fields
- **Raw Fallback**: If not valid JSON, returns the raw value

## Examples

### Example 1: Direct Retrieval with JSON (v1.0.3+)

**Secret in Infisical:**
```
my_service_name = {"username": "API_USER", "password": "secret_pass"}
```

**Node Configuration:**
- Service Name: `my_service_name`
- Secret Path: `/`

**Output:**
```json
{
  "username": "API_USER",
  "password": "secret_pass"
}
```

### Example 2: Simple Retrieval

**Secret in Infisical:**
```
api-token = "sk-1234567890abcdef"
```

**Node Configuration:**
- Service Name: `api-token`
- Secret Path: `/`

**Output:**
```json
{
  "api-token": "sk-1234567890abcdef"
}
```

### Example 3: Automatic Fallback

**Secret in Infisical:**
```
DATABASE_CONFIG = {"host": "db.prod.com", "port": 5432, "ssl": true}
```

**Node Configuration:**
- Service Name: `database` (note: doesn't match exactly)
- Secret Path: `/`

**Process:**
1. Search `database` → Not found
2. Search `DATABASE` → Not found  
3. Search `database_config` → Not found
4. Search `DATABASE_CONFIG` → Found!

**Output:**
```json
{
  "host": "db.prod.com",
  "port": 5432,
  "ssl": true
}
```

### Example 4: Automatic JSON Correction

**Secret in Infisical (with formatting error):**
```
api_config = '{username": "api_user", "token": "abc123"}'
```

**Node Configuration:**
- Service Name: `api_config`
- Secret Path: `/`

**Process:**
1. Detects malformed JSON: `{username"` 
2. Auto-corrects: `{"username"`
3. Successfully parses

**Output:**
```json
{
  "username": "api_user",
  "token": "abc123"
}
```

## Complete Workflow Example

```json
{
  "nodes": [
    {
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "position": [250, 300]
    },
    {
      "name": "Get DB Credentials",
      "type": "n8n-nodes-infisical.infisical",
      "position": [450, 300],
      "parameters": {
        "serviceName": "database"
      },
      "credentials": {
        "infisicalApi": {
          "id": "1",
          "name": "Infisical Production"
        }
      }
    },
    {
      "name": "Connect to Database",
      "type": "n8n-nodes-base.postgres",
      "position": [650, 300],
      "parameters": {
        "host": "={{$node['Get DB Credentials'].json.host}}",
        "database": "myapp",
        "user": "={{$node['Get DB Credentials'].json.username}}",
        "password": "={{$node['Get DB Credentials'].json.password}}",
        "operation": "select",
        "query": "SELECT * FROM users LIMIT 10"
      }
    }
  ],
  "connections": {
    "Start": {
      "main": [
        [
          {
            "node": "Get DB Credentials",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get DB Credentials": {
      "main": [
        [
          {
            "node": "Connect to Database",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Authentication Error

**Error:** `Failed to retrieve secrets from Infisical: Authentication failed`

**Solutions:**
- Verify that the access token is correct
- Check that the token hasn't expired
- Verify that the project and environment are correct
- Check the access token permissions

#### 2. Secret Not Found

**Error:** `Secret not found`

**Solutions:**
- Verify that the secret exists in Infisical
- Check the specified path
- Verify naming patterns
- Check the selected environment

#### 3. Cache Issues

**Problem:** Updated secrets are not retrieved

**Solutions:**
- Reduce Cache TTL in credentials
- Restart the workflow
- Temporarily change service name to bypass cache

#### 4. Connection Errors

**Error:** `Network timeout` or `Connection refused`

**Solutions:**
- Verify network connectivity
- Check the Infisical host URL
- Verify firewalls
- Check if the Infisical instance is reachable

### Debug

For detailed debugging:

1. **Enable logging** in n8n:
   ```bash
   export N8N_LOG_LEVEL=debug
   n8n start
   ```

2. **Check logs** for the Infisical node:
   ```bash
   tail -f ~/.n8n/logs/n8n.log | grep -i infisical
   ```

3. **Test credentials** manually:
   ```javascript
   // Use browser console in dev tools
   const response = await fetch('https://app.infisical.com/api/v1/auth/token/validate', {
     headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
   });
   console.log(await response.json());
   ```

## Best Practices

### Security

1. **Token Rotation**: Regularly rotate access tokens
2. **Least Privilege Principle**: Grant only necessary permissions
3. **Environment Separation**: Use different tokens for different environments
4. **Audit Log**: Monitor token usage in Infisical

### Performance

1. **Cache TTL**: Set appropriate TTL (300-900 seconds)
2. **Batch Secrets**: Retrieve multiple secrets in one call when possible
3. **Path Organization**: Organize secrets in logical paths

### Maintenance

1. **Naming Convention**: Use consistent naming conventions
2. **Documentation**: Document custom mappings
3. **Testing**: Regularly test workflows with new secrets
4. **Backup**: Maintain configuration backups

## Compatibilità API

### Version 1.0.3+ (Recommended)
- **Infisical SDK**: v4.0.6+
- **Authentication**: Access Token (Bearer)
- **Method**: `getSecret()` for direct retrieval
- **Project ID**: UUID instead of slug
- **Performance**: Optimized for single requests

### Previous Versions (Legacy)
- **Infisical SDK**: v3.x
- **Authentication**: Service Token
- **Method**: `listSecrets()` with filtering
- **Project Slug**: Textual project name

The node uses the official Infisical TypeScript SDK (`@infisical/sdk`) which provides:
- Automatic API version management
- Built-in retry mechanisms  
- Type safety for all operations
- Secure Bearer Token authentication
- Compatibility with Infisical Cloud and Self-hosted

## Dependencies

- `@infisical/sdk`: Official Infisical TypeScript SDK
- `n8n-workflow`: n8n core workflow functionality

## Contributing

Contributions are welcome! To contribute:

1. **Fork** the repository
2. **Create** a branch for your feature
3. **Make** changes
4. **Add** tests if necessary
5. **Submit** a pull request

### Local Development

```bash
# Clone the repository
git clone https://github.com/username/n8n-nodes-infisical.git
cd n8n-nodes-infisical

# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/username/n8n-nodes-infisical/issues)
- **Documentation**: [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- **Infisical Docs**: [Infisical Documentation](https://infisical.com/docs)

---

**Made with for the n8n community**

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Configuration

### Credentials

1. **Host**: The URL of your Infisical instance (default: https://app.infisical.com)
2. **Service Token**: Your Infisical service token (format: st.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
3. **Project Slug**: The slug of your Infisical project
4. **Environment Slug**: The environment slug (e.g., dev, staging, prod)
5. **Cache TTL**: How long to cache secrets in seconds (default: 300)

### Node Parameters

- **Service Name**: The name of the service for which to retrieve credentials
- **Secret Path**: The path where secrets are stored (default: /)
- **Credential Mapping**: Optional custom mappings between Infisical secret keys and output field names
=======
# n8n-infisical-node



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/ee/gitlab-basics/add-file.html#add-a-file-using-the-command-line) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.az.abssrv.it/abs-microservices/n8n-infisical-node.git
git branch -M develop
git push -uf origin develop
```

## Integrate with your tools

- [ ] [Set up project integrations](https://gitlab.az.abssrv.it/abs-microservices/n8n-infisical-node/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/ee/user/project/merge_requests/merge_when_pipeline_succeeds.html)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/index.html)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> 8c898fd (Initial commit)
