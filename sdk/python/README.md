# Prompt Firewall Python SDK

Lightweight Python SDK for the Prompt Firewall API.

## Installation

```bash
pip install requests
```

Or copy `prompt_firewall.py` directly into your project.

## Quick Start

```python
from prompt_firewall import PromptFirewall

# Initialize client
firewall = PromptFirewall(base_url="https://your-firewall-url.com")

# Evaluate a prompt
result = firewall.query("My email is user@example.com")

print(f"Decision: {result.decision}")  # 'sanitize', 'block', 'allow', etc.
print(f"Modified: {result.prompt_modified}")
print(f"Risks: {result.risks}")
```

## API Reference

### `PromptFirewall(base_url, api_key=None)`

Initialize the firewall client.

- `base_url`: Base URL of the firewall API
- `api_key`: Optional API key for authenticated requests

### `query(prompt: str) -> FirewallResult`

Evaluate a prompt through the firewall.

Returns a `FirewallResult` with:
- `decision`: 'allow', 'block', 'modify', or 'sanitize'
- `prompt_modified`: The sanitized/modified prompt
- `response`: AI response (if allowed)
- `blocked`: Boolean indicating if blocked
- `risks`: List of detected risks
- `explain`: List of rule explanations

### `get_policies() -> List[Dict]`

Get all firewall policies (requires authentication).

### `get_logs(**filters) -> Dict`

Get firewall logs with optional filters (requires authentication).

## Examples

### Basic Usage

```python
firewall = PromptFirewall()
result = firewall.query("What is the weather?")
assert result.decision == "allow"
```

### With Authentication

```python
firewall = PromptFirewall(
    base_url="https://api.example.com",
    api_key="your-api-key"
)
result = firewall.query("Test prompt")
```

### Check for Risks

```python
result = firewall.query("My SSN is 123-45-6789")
if result.risks:
    for risk in result.risks:
        print(f"Risk: {risk['type']} - {risk['message']}")
```

