# SDK Quick Examples

## Python SDK - 5 Line Example

```python
from prompt_firewall import PromptFirewall

firewall = PromptFirewall(base_url="https://prompt-firewall.vercel.app")
result = firewall.query("My email is user@example.com")
print(f"Decision: {result.decision}, Risks: {len(result.risks)}")
```

## JavaScript SDK - 5 Line Example

```javascript
const PromptFirewall = require('./prompt-firewall');

const firewall = new PromptFirewall('https://prompt-firewall.vercel.app');
const result = await firewall.query("My email is user@example.com");
console.log(`Decision: ${result.decision}, Risks: ${result.risks.length}`);
```

## cURL Example

```bash
curl -X POST https://prompt-firewall.vercel.app/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "My email is user@example.com"}'
```

