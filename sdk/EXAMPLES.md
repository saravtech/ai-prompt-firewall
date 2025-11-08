# SDK Quick Examples

## Python SDK - 5 Line Example

```python
from prompt_firewall import PromptFirewall

firewall = PromptFirewall(base_url="https://your-api.com")
result = firewall.query("My email is user@example.com")
print(f"Decision: {result.decision}, Risks: {len(result.risks)}")
```

## JavaScript SDK - 5 Line Example

```javascript
const PromptFirewall = require('./prompt-firewall');

const firewall = new PromptFirewall('https://your-api.com');
const result = await firewall.query("My email is user@example.com");
console.log(`Decision: ${result.decision}, Risks: ${result.risks.length}`);
```

## cURL Example

```bash
curl -X POST https://your-api.com/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "My email is user@example.com"}'
```

