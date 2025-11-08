# Prompt Firewall JavaScript SDK

Lightweight JavaScript/Node.js SDK for the Prompt Firewall API.

## Installation

### Browser

```html
<script src="prompt-firewall.js"></script>
```

### Node.js

```bash
npm install  # (if using package.json)
# Or copy prompt-firewall.js directly
```

## Quick Start

### Browser

```javascript
const firewall = new PromptFirewall('https://your-firewall-url.com');

firewall.query("My email is user@example.com")
  .then(result => {
    console.log('Decision:', result.decision);
    console.log('Modified:', result.promptModified);
    console.log('Risks:', result.risks);
  });
```

### Node.js

```javascript
const PromptFirewall = require('./prompt-firewall');

const firewall = new PromptFirewall('http://localhost:3000');

async function main() {
  const result = await firewall.query("What is the weather?");
  console.log('Decision:', result.decision);
}
main();
```

## API Reference

### `new PromptFirewall(baseUrl, apiKey)`

Initialize the firewall client.

- `baseUrl`: Base URL of the firewall API (default: 'http://localhost:3000')
- `apiKey`: Optional API key for authenticated requests

### `query(prompt: string): Promise<Object>`

Evaluate a prompt through the firewall.

Returns a Promise resolving to:
```javascript
{
  id: string,
  decision: 'allow' | 'block' | 'modify' | 'sanitize',
  promptModified: string,
  response: string | null,
  blocked: boolean,
  risks: Array<{type, severity, message}>,
  explain: Array<{rule, matched, reason}>
}
```

### `getPolicies(): Promise<Array>`

Get all firewall policies (requires authentication).

### `getLogs(filters): Promise<Object>`

Get firewall logs with optional filters (requires authentication).

## Examples

### Basic Usage

```javascript
const firewall = new PromptFirewall();
const result = await firewall.query("What is the weather?");
console.log(result.decision); // 'allow'
```

### With Authentication

```javascript
const firewall = new PromptFirewall(
  'https://api.example.com',
  'your-api-key'
);
const result = await firewall.query("Test prompt");
```

### Check for Risks

```javascript
const result = await firewall.query("My SSN is 123-45-6789");
if (result.risks.length > 0) {
  result.risks.forEach(risk => {
    console.log(`Risk: ${risk.type} - ${risk.message}`);
  });
}
```

