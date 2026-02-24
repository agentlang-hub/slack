# slack
Slack Resolver

## Setup

The slack resolver uses [integration-manager](../integration-manager) to handle authentication. You need a running integration-manager instance and a seeded slack integration before using this resolver.

### 1. Seed the integration-manager

Create the slack integration with a bearer token config:

```
POST /integmanager.core/integration
{ "name": "slack" }

POST /integmanager.core/integration/slack/integrationConfig/config
{ "name": "bot-token", "type": "bearer-token" }

POST /integmanager.core/integration/slack/integrationConfig/config/bot-token/configBearerToken/bearerTokenConfig
{ "token": "xoxb-your-slack-bot-token" }
```

### 2. Set environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `INTEG_MANAGER_HOST` | URL of the integration-manager service | `http://localhost:8085` |
| `SLACK_CHANNEL` | Slack channel ID to send/receive messages | *(required)* |
| `AL_HOST` | Host URL for suspension approval/reject links | `http://localhost:8080` |

### 3. Usage

The resolver exposes two functions via the `slack` module:

- **`send(channel, message, env)`** -- Posts a message to the configured Slack channel with approve/reject suspension links.
- **`receive(threadId, env)`** -- Waits for a reply in a thread, returning the latest response or suspension user data if available.
