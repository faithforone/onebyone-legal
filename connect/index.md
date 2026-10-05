# Connect any MCP agent to one-by.one

Machine-readable version of https://one-by.one/connect/ (Korean page: https://one-by.one/ko/connect/). Last updated: 2026-10-05. English only.

one-by.one is an iPhone app. A person's AI (ChatGPT, Claude, Claude Code, Codex CLI, Cursor or any MCP agent) plans their day into small cards, and the iPhone shows one card at a time. This page tells an AI agent, or the person using one, how to connect to the one-by.one MCP server.

## Paste this into your AI agent

Copy the block below into your agent. It is written so the agent can follow it as-is.

```text
Add the one-by.one MCP server to yourself and connect it.

- Server URL: https://mcp.one-by.one/mcp
- Transport: remote streamable HTTP. Name the server "onebyone".
- Auth: OAuth sign-in with dynamic client registration. There is no API key or token, so do not ask me for one.

Steps:
1. Add the server to your MCP configuration and keep my existing servers. If you cannot change your own configuration, give me the exact command or setting for this client.
2. Start the OAuth sign-in. If you cannot open a browser, show me the sign-in link.
3. I will sign in to my one-by.one account and approve the permissions: context:read, activity:read and activity:write. The approval screen may label you "Unverified app"; that is normal for unverified clients.
4. When I am back, confirm that the onebyone tools are listed. Do not create or change any plans until I ask. If the connection is refused because the limit of 3 AI connections is reached, tell me.

Instructions for each client: https://one-by.one/connect/index.md
```

## Server facts

| Item | Value |
|---|---|
| Server URL | `https://mcp.one-by.one/mcp` |
| Transport | Streamable HTTP (remote) |
| Authentication | OAuth sign-in in the browser, with dynamic client registration. No API key, token or client secret. |
| Local clients | Supported. Loopback redirects are allowed. |
| Suggested server name | `onebyone` |
| Permissions | `context:read` (read the context the user shares for planning), `activity:read` (read plans and recorded activity), `activity:write` (create or update plans and save activity) |
| Limit | 3 AI connections per account |
| Unverified clients | Shown as "Unverified app" on the approval screen |
| Account | The user signs in with their existing one-by.one account |
| Subscription | AI connections require the account's applicable subscription entitlement |

## Generic procedure

1. Add the server URL to the AI tool using Streamable HTTP.
2. Follow the browser prompt and sign in to the existing one-by.one account.
3. Review the app name and permissions, then approve access. Return to the AI tool.

Do not ask the user for an API key or token. Merge the `onebyone` entry into existing settings; do not replace them. Do not create or change plans until the user asks.

## Per-tool commands

All commands use the server URL `https://mcp.one-by.one/mcp` and the name `onebyone`. Menus can vary by version. The source link for each tool is its official documentation.

### ChatGPT (UI steps)

Source: https://developers.openai.com/plugins/deploy/connect-chatgpt

1. Turn on Developer mode if the account allows it (Settings > Security and login > Developer mode).
2. Open Plugins, select +, name the connection `one-by.one` and enter `https://mcp.one-by.one/mcp`. Older interfaces may call this Apps or Connectors.
3. Create the connection and finish the one-by.one OAuth sign-in.
4. Select it from the tools menu in a new chat. Availability depends on the plan and workspace policy.

### Claude web and Desktop (UI steps)

Source: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp

1. Open Customize > Connectors and add a custom web connector.
2. Name it `one-by.one` and paste `https://mcp.one-by.one/mcp`.
3. Choose sign-in authentication and automatic client registration when that option is shown.
4. Complete the OAuth flow, then enable the connector in the conversation.

Claude Desktop uses the same remote custom connector. Team and Enterprise workspaces may need an owner to add it first.

### Claude Code

Source: https://code.claude.com/docs/en/mcp

```sh
claude mcp add --transport http onebyone https://mcp.one-by.one/mcp
```

Then, inside a Claude Code session, run `/mcp`, select onebyone and authenticate in the browser:

```text
/mcp
```

### Codex CLI

Source: https://developers.openai.com/codex/mcp

```sh
codex mcp add onebyone --url https://mcp.one-by.one/mcp
codex mcp login onebyone
```

Alternative: merge this into `~/.codex/config.toml`, then run `codex mcp login onebyone`.

```toml
[mcp_servers.onebyone]
url = "https://mcp.one-by.one/mcp"
```

Use `/mcp` in Codex to inspect the connection.

### Cursor

Source: https://cursor.com/docs/mcp

Merge into `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (all projects). Save, restart Cursor, complete the OAuth prompt and use the tools in Agent.

```json
{
  "mcpServers": {
    "onebyone": {
      "url": "https://mcp.one-by.one/mcp"
    }
  }
}
```

### VS Code (GitHub Copilot)

Source: https://code.visualstudio.com/docs/agents/reference/mcp-configuration

Merge into `.vscode/mcp.json` (user-level: run `MCP: Open User Configuration`). Use the editor's Start action for onebyone, complete the browser sign-in and enable its tools in Copilot Agent.

```json
{
  "servers": {
    "onebyone": {
      "type": "http",
      "url": "https://mcp.one-by.one/mcp"
    }
  }
}
```

### Gemini CLI

Source: https://geminicli.com/docs/tools/mcp-server/

Merge into `~/.gemini/settings.json` or the project's `.gemini/settings.json`. OAuth is discovered automatically.

```json
{
  "mcpServers": {
    "onebyone": {
      "httpUrl": "https://mcp.one-by.one/mcp"
    }
  }
}
```

Then, inside a Gemini CLI session (not the shell):

```text
/mcp auth onebyone
```

### Windsurf (Cascade)

Source: https://docs.windsurf.com/windsurf/cascade/mcp

In Cascade, open the "..." Actions menu > MCPs > Open MCP config file. Merge this into `mcp_config.json`, save and complete OAuth sign-in when prompted. The official Windsurf guide now redirects to Devin Desktop and applies to the legacy Cascade agent; newer Devin Local tabs use a different setup.

```json
{
  "mcpServers": {
    "onebyone": {
      "serverUrl": "https://mcp.one-by.one/mcp"
    }
  }
}
```

### Any other MCP agent

Use `https://mcp.one-by.one/mcp` with remote Streamable HTTP and OAuth. The client must support OAuth discovery and dynamic client registration. Check the tool's own documentation for its configuration format.

## Disconnecting

In the iPhone app, open Settings › AI apps and tap "Disconnect" next to that connection. You can also use "Disconnect" on its one-by.one authorization page, or remove the connector in the AI tool. Disconnecting stops future tool access. It does not delete one-by.one records or information the AI already received.

## Related

- Human-readable page: https://one-by.one/connect/
- Korean page: https://one-by.one/ko/connect/
- Privacy policy (what a connected AI receives): https://one-by.one/privacy/#connected-ai
- Support: https://one-by.one/support/
- Product overview for AI: https://one-by.one/llms.txt and https://one-by.one/llms-full.txt
