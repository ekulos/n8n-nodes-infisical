# Practical Usage Examples

This guide contains practical examples and real-world use cases for the Infisical node in n8n.

## 📚 Examples Index

1. [PostgreSQL Database](#1-postgresql-database)
2. [REST API with Authentication](#2-rest-api-with-authentication)
3. [SMTP Email](#3-smtp-email)
4. [Redis Cache](#4-redis-cache)
5. [Webhook with API Key](#5-webhook-with-api-key)
6. [Microservices with Service Discovery](#6-microservices-with-service-discovery)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Monitoring and Alerting](#8-monitoring-and-alerting)

---

## 1. PostgreSQL Database

### Scenario
Secure connection to a PostgreSQL database using credentials stored in Infisical.

### Infisical Setup
```bash
# Secrets in Infisical (environment: production, path: /databases)
DATABASE_USERNAME = "app_user"
DATABASE_PASSWORD = "super_secure_password_123"
DATABASE_HOST = "db-prod.company.com"
DATABASE_PORT = "5432"
DATABASE_NAME = "production_app"
```

### n8n Configuration

**Infisical Node:**
- **Service Name**: `database`
- **Secret Path**: `/databases`
- **Credential Mapping**: (empty - uses automatic patterns)

**Workflow JSON:**
```json
{
  "meta": {
    "instanceId": "1234567890abcdef"
  },
  "nodes": [
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "serviceName": "database",
        "secretPath": "/databases"
      },
      "name": "Get DB Credentials",
      "type": "n8n-nodes-infisical.infisical",
      "typeVersion": 1,
      "position": [460, 300],
      "credentials": {
        "infisicalApi": {
          "id": "1",
          "name": "Production Infisical"
        }
      }
    },
    {
      "parameters": {
        "host": "={{$node['Get DB Credentials'].json.host}}",
        "port": "={{$node['Get DB Credentials'].json.port}}",
        "database": "={{$node['Get DB Credentials'].json.name || 'production_app'}}",
        "user": "={{$node['Get DB Credentials'].json.username}}",
        "password": "={{$node['Get DB Credentials'].json.password}}",
        "operation": "select",
        "query": "SELECT id, username, email, created_at FROM users WHERE active = true ORDER BY created_at DESC LIMIT 10"
      },
      "name": "Query Users",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "operation": "create",
        "resource": "table",
        "columns": "id,username,email,created_at",
        "rows": "={{$json}}"
      },
      "name": "Format Results",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [900, 300]
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
            "node": "Query Users",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Query Users": {
      "main": [
        [
          {
            "node": "Format Results",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Expected Output
```json
{
  "username": "app_user",
  "password": "super_secure_password_123",
  "host": "db-prod.company.com",
  "port": "5432"
}
```

---

## 2. REST API with Authentication

### Scenario
Call to an external API that requires OAuth2 or API Key authentication.

### Infisical Setup
```bash
# Secrets in Infisical (environment: production, path: /apis)
EXTERNAL_API_CLIENT_ID = "client_abc123"
EXTERNAL_API_CLIENT_SECRET = "secret_xyz789"
EXTERNAL_API_BASE_URL = "https://api.external-service.com"
EXTERNAL_API_SCOPE = "read:users write:data"
```

### n8n Configuration

**Custom Mappings:**
```javascript
// Credential Mapping in Infisical node
[
  { "credentialField": "clientId", "secretKeyPattern": "EXTERNAL_API_CLIENT_ID" },
  { "credentialField": "clientSecret", "secretKeyPattern": "EXTERNAL_API_CLIENT_SECRET" },
  { "credentialField": "baseUrl", "secretKeyPattern": "EXTERNAL_API_BASE_URL" },
  { "credentialField": "scope", "secretKeyPattern": "EXTERNAL_API_SCOPE" }
]
```

**Complete Workflow:**
```json
{
  "nodes": [
    {
      "parameters": {},
      "name": "Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "serviceName": "external",
        "secretPath": "/apis",
        "credentialMapping": {
          "mappings": [
            {
              "credentialField": "clientId",
              "secretKeyPattern": "EXTERNAL_API_CLIENT_ID"
            },
            {
              "credentialField": "clientSecret", 
              "secretKeyPattern": "EXTERNAL_API_CLIENT_SECRET"
            },
            {
              "credentialField": "baseUrl",
              "secretKeyPattern": "EXTERNAL_API_BASE_URL"
            }
          ]
        }
      },
      "name": "Get API Credentials",
      "type": "n8n-nodes-infisical.infisical",
      "position": [460, 300]
    },
    {
      "parameters": {
        "url": "={{$node['Get API Credentials'].json.baseUrl}}/oauth/token",
        "requestMethod": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={\"grant_type\": \"client_credentials\", \"client_id\": \"{{$node['Get API Credentials'].json.clientId}}\", \"client_secret\": \"{{$node['Get API Credentials'].json.clientSecret}}\", \"scope\": \"read:users\"}"
      },
      "name": "Get OAuth Token",
      "type": "n8n-nodes-base.httpRequest",
      "position": [680, 300]
    },
    {
      "parameters": {
        "url": "={{$node['Get API Credentials'].json.baseUrl}}/api/v1/users",
        "requestMethod": "GET",
        "headerParametersJson": "={\"Authorization\": \"Bearer {{$json.access_token}}\", \"Content-Type\": \"application/json\"}"
      },
      "name": "Fetch Users",
      "type": "n8n-nodes-base.httpRequest",
      "position": [900, 300]
    }
  ]
}
```

---

## 3. SMTP Email

### Scenario
Sending emails via SMTP with secure credentials.

### Infisical Setup
```bash
# Secrets in Infisical (environment: production, path: /email)
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = "587"
SMTP_USERNAME = "noreply@company.com"
SMTP_PASSWORD = "app_specific_password"
SMTP_FROM_NAME = "Company Notifications"
```

### n8n Configuration

**Infisical Node:**
- **Service Name**: `smtp`
- **Secret Path**: `/email`

**Email Workflow:**
```json
{
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 9 * * 1"
            }
          ]
        }
      },
      "name": "Weekly Trigger",
      "type": "n8n-nodes-base.cron",
      "position": [240, 300]
    },
    {
      "parameters": {
        "serviceName": "smtp",
        "secretPath": "/email"
      },
      "name": "Get SMTP Credentials",
      "type": "n8n-nodes-infisical.infisical",
      "position": [460, 300]
    },
    {
      "parameters": {
        "fromEmail": "={{$node['Get SMTP Credentials'].json.username}}",
        "fromName": "={{$node['Get SMTP Credentials'].json.fromName || 'System'}}",
        "toEmail": "team@company.com",
        "subject": "Weekly Report - {{$now.format('YYYY-MM-DD')}}",
        "text": "Weekly report is ready for review.",
        "html": "<h1>Weekly Report</h1><p>Your weekly report is ready for review.</p>",
        "options": {
          "smtpHost": "={{$node['Get SMTP Credentials'].json.host}}",
          "smtpPort": "={{$node['Get SMTP Credentials'].json.port}}",
          "smtpUser": "={{$node['Get SMTP Credentials'].json.username}}",
          "smtpPassword": "={{$node['Get SMTP Credentials'].json.password}}"
        }
      },
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "position": [680, 300]
    }
  ]
}
```

---

## 4. Redis Cache

### Scenario
Connection to Redis for caching with authentication.

### Infisical Setup
```bash
# Secrets in Infisical (environment: production, path: /cache)
REDIS_PROD_HOST = "redis-cluster.company.com"
REDIS_PROD_PORT = "6379"
REDIS_PROD_PASSWORD = "redis_secure_password"
REDIS_PROD_DATABASE = "0"
```

### n8n Configuration

**Pattern with Placeholder:**
```javascript
// Service Name: redis_prod
// Automatic patterns will work for REDIS_PROD_*
```

**Redis Workflow:**
```json
{
  "nodes": [
    {
      "parameters": {
        "serviceName": "redis_prod",
        "secretPath": "/cache"
      },
      "name": "Get Redis Credentials",
      "type": "n8n-nodes-infisical.infisical",
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "set",
        "key": "user:{{$json.userId}}:session",
        "value": "={{JSON.stringify($json.sessionData)}}",
        "options": {
          "host": "={{$node['Get Redis Credentials'].json.host}}",
          "port": "={{$node['Get Redis Credentials'].json.port}}",
          "password": "={{$node['Get Redis Credentials'].json.password}}",
          "database": "={{$node['Get Redis Credentials'].json.database || 0}}"
        }
      },
      "name": "Cache Session",
      "type": "n8n-nodes-base.redis",
      "position": [460, 300]
    }
  ]
}
```

---

## 5. Webhook with API Key

### Scenario
Secure webhook that requires API Key validation.

### Infisical Setup
```bash
# Secrets in Infisical (environment: production, path: /webhooks)
WEBHOOK_SECRET_KEY = "webhook_secret_abc123xyz"
WEBHOOK_API_KEY = "api_key_def456uvw"
WEBHOOK_ALLOWED_IPS = "192.168.1.0/24,10.0.0.0/8"
```

### n8n Configuration

**Secure Webhook Workflow:**
```json
{
  "nodes": [
    {
      "parameters": {
        "path": "secure-webhook",
        "options": {
          "rawBody": true
        }
      },
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "serviceName": "webhook",
        "secretPath": "/webhooks",
        "credentialMapping": {
          "mappings": [
            {
              "credentialField": "secretKey",
              "secretKeyPattern": "WEBHOOK_SECRET_KEY"
            },
            {
              "credentialField": "apiKey",
              "secretKeyPattern": "WEBHOOK_API_KEY"
            }
          ]
        }
      },
      "name": "Get Webhook Keys",
      "type": "n8n-nodes-infisical.infisical",
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$node['Webhook Trigger'].json.headers['x-api-key']}}",
              "operation": "equal",
              "value2": "={{$node['Get Webhook Keys'].json.apiKey}}"
            }
          ]
        }
      },
      "name": "Validate API Key",
      "type": "n8n-nodes-base.if",
      "position": [680, 300]
    },
    {
      "parameters": {
        "message": "Invalid API Key",
        "options": {
          "httpCode": 401
        }
      },
      "name": "Unauthorized",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [900, 400]
    },
    {
      "parameters": {
        "message": "Webhook processed successfully"
      },
      "name": "Success Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [900, 200]
    }
  ]
}
```

---

## 6. Microservices with Service Discovery

### Scenario
Workflow that communicates with different microservices using centralized credentials.

### Infisical Setup
```bash
# Secrets in Infisical (environment: production, path: /services)

# User Service
USER_SERVICE_URL = "https://user-service.internal.company.com"
USER_SERVICE_API_KEY = "user_api_key_123"

# Order Service  
ORDER_SERVICE_URL = "https://order-service.internal.company.com"
ORDER_SERVICE_API_KEY = "order_api_key_456"

# Payment Service
PAYMENT_SERVICE_URL = "https://payment-service.internal.company.com" 
PAYMENT_SERVICE_API_KEY = "payment_api_key_789"
```

### n8n Configuration

**Multi-Service Workflow:**
```json
{
  "nodes": [
    {
      "parameters": {
        "serviceName": "user_service",
        "secretPath": "/services",
        "credentialMapping": {
          "mappings": [
            {
              "credentialField": "url",
              "secretKeyPattern": "USER_SERVICE_URL"
            },
            {
              "credentialField": "apiKey", 
              "secretKeyPattern": "USER_SERVICE_API_KEY"
            }
          ]
        }
      },
      "name": "Get User Service Config",
      "type": "n8n-nodes-infisical.infisical",
      "position": [240, 200]
    },
    {
      "parameters": {
        "serviceName": "order_service", 
        "secretPath": "/services",
        "credentialMapping": {
          "mappings": [
            {
              "credentialField": "url",
              "secretKeyPattern": "ORDER_SERVICE_URL"
            },
            {
              "credentialField": "apiKey",
              "secretKeyPattern": "ORDER_SERVICE_API_KEY" 
            }
          ]
        }
      },
      "name": "Get Order Service Config",
      "type": "n8n-nodes-infisical.infisical", 
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "={{$node['Get User Service Config'].json.url}}/api/v1/users/{{$json.userId}}",
        "headerParametersJson": "={\"Authorization\": \"Bearer {{$node['Get User Service Config'].json.apiKey}}\", \"Content-Type\": \"application/json\"}"
      },
      "name": "Fetch User Data",
      "type": "n8n-nodes-base.httpRequest",
      "position": [460, 200]
    },
    {
      "parameters": {
        "url": "={{$node['Get Order Service Config'].json.url}}/api/v1/orders",
        "requestMethod": "POST",
        "headerParametersJson": "={\"Authorization\": \"Bearer {{$node['Get Order Service Config'].json.apiKey}}\", \"Content-Type\": \"application/json\"}",
        "bodyParametersJson": "={\"userId\": \"{{$json.userId}}\", \"items\": {{$json.items}}, \"total\": {{$json.total}}}"
      },
      "name": "Create Order",
      "type": "n8n-nodes-base.httpRequest",
      "position": [460, 300]
    }
  ]
}
```

---

## 7. CI/CD Pipeline

### Scenario
Automated deployment workflow that accesses different CI/CD services.

### Infisical Setup
```bash
# Secrets in Infisical (environment: production, path: /cicd)
GITHUB_TOKEN = "ghp_personal_access_token"
DOCKER_REGISTRY_URL = "registry.company.com"
DOCKER_REGISTRY_USERNAME = "ci_user"
DOCKER_REGISTRY_PASSWORD = "docker_password"
KUBERNETES_CLUSTER_URL = "https://k8s.company.com"
KUBERNETES_TOKEN = "k8s_service_account_token"
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/xxx/yyy/zzz"
```

### n8n Configuration

**CI/CD Workflow:**
```json
{
  "nodes": [
    {
      "parameters": {
        "serviceName": "github",
        "secretPath": "/cicd",
        "credentialMapping": {
          "mappings": [
            {
              "credentialField": "token",
              "secretKeyPattern": "GITHUB_TOKEN"
            }
          ]
        }
      },
      "name": "Get GitHub Config",
      "type": "n8n-nodes-infisical.infisical",
      "position": [240, 200]
    },
    {
      "parameters": {
        "serviceName": "docker_registry",
        "secretPath": "/cicd"
      },
      "name": "Get Docker Config",
      "type": "n8n-nodes-infisical.infisical",
      "position": [240, 300]
    },
    {
      "parameters": {
        "authentication": "customAuth",
        "customAuth": {
          "auth": "={\"Authorization\": \"token {{$node['Get GitHub Config'].json.token}}\"}"
        },
        "requestMethod": "GET",
        "url": "https://api.github.com/repos/company/app/releases/latest"
      },
      "name": "Get Latest Release",
      "type": "n8n-nodes-base.httpRequest",
      "position": [460, 200]
    },
    {
      "parameters": {
        "command": "docker login {{$node['Get Docker Config'].json.url}} -u {{$node['Get Docker Config'].json.username}} -p {{$node['Get Docker Config'].json.password}} && docker pull {{$node['Get Docker Config'].json.url}}/app:{{$json.tag_name}}"
      },
      "name": "Pull Docker Image",
      "type": "n8n-nodes-base.executeCommand",
      "position": [680, 200]
    }
  ]
}
```

---

## 8. Monitoring and Alerting

### Scenario
Monitoring system that checks application health and sends alerts.

### Infisical Setup
```bash
# Secrets in Infisical (environment: production, path: /monitoring)
PROMETHEUS_URL = "https://prometheus.company.com"
PROMETHEUS_TOKEN = "prometheus_bearer_token"
GRAFANA_URL = "https://grafana.company.com"
GRAFANA_API_KEY = "grafana_api_key_123"
PAGERDUTY_INTEGRATION_KEY = "pagerduty_integration_key"
TEAMS_WEBHOOK_URL = "https://company.webhook.office.com/webhookb2/xxx"
```

### n8n Configuration

**Monitoring Workflow:**
```json
{
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 5
            }
          ]
        }
      },
      "name": "Every 5 Minutes",
      "type": "n8n-nodes-base.cron",
      "position": [240, 300]
    },
    {
      "parameters": {
        "serviceName": "prometheus",
        "secretPath": "/monitoring"
      },
      "name": "Get Prometheus Config",
      "type": "n8n-nodes-infisical.infisical",
      "position": [460, 300]
    },
    {
      "parameters": {
        "url": "={{$node['Get Prometheus Config'].json.url}}/api/v1/query",
        "requestMethod": "GET",
        "headerParametersJson": "={\"Authorization\": \"Bearer {{$node['Get Prometheus Config'].json.token}}\"}",
        "qs": {
          "query": "up{job=\"api-server\"} == 0"
        }
      },
      "name": "Check API Health",
      "type": "n8n-nodes-base.httpRequest",
      "position": [680, 300]
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json.data.result.length}}",
              "operation": "larger",
              "value2": 0
            }
          ]
        }
      },
      "name": "Check if Down",
      "type": "n8n-nodes-base.if",
      "position": [900, 300]
    },
    {
      "parameters": {
        "serviceName": "teams",
        "secretPath": "/monitoring",
        "credentialMapping": {
          "mappings": [
            {
              "credentialField": "webhookUrl",
              "secretKeyPattern": "TEAMS_WEBHOOK_URL"
            }
          ]
        }
      },
      "name": "Get Teams Config",
      "type": "n8n-nodes-infisical.infisical",
      "position": [1120, 200]
    },
    {
      "parameters": {
        "url": "={{$node['Get Teams Config'].json.webhookUrl}}",
        "requestMethod": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={\"@type\": \"MessageCard\", \"@context\": \"http://schema.org/extensions\", \"summary\": \"API Server Alert\", \"themeColor\": \"FF0000\", \"title\": \"🚨 API Server Down\", \"text\": \"One or more API servers are not responding. Immediate attention required.\"}"
      },
      "name": "Send Teams Alert",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1340, 200]
    }
  ]
}
```

## 💡 Tips and Best Practices

### 1. Naming Conventions
```bash
# Consistent naming patterns
{SERVICE}_{ENVIRONMENT}_{FIELD}
DATABASE_PROD_USERNAME
DATABASE_PROD_PASSWORD

# Or path-based organization
/environments/prod/database/username
/environments/prod/database/password
```

### 2. Error Handling
```javascript
// Always enable "Continue on Fail" for critical nodes
// Add IF nodes to check for errors
{
  "conditions": {
    "string": [
      {
        "value1": "={{$node['Get Credentials'].json.error}}",
        "operation": "isEmpty"
      }
    ]
  }
}
```

### 3. Caching Strategy
```javascript
// Cache TTL based on usage
production: 900 seconds (15 minutes)
staging: 300 seconds (5 minutes) 
development: 60 seconds (1 minute)
```

### 4. Security
```javascript
// Never log credentials
// Always use HTTPS for Infisical
// Regularly rotate access tokens
// Principle of least privilege
```

---

**Have a specific use case?** Open an issue on GitHub to request new examples!