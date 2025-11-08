# Screenshots Guide

## Recommended Screenshots

After deployment, capture these screenshots:

### 1. Demo UI Homepage
- **File**: `screenshots/demo-homepage.png`
- **What to show**:
  - Prompt input field
  - "Run Firewall" button
  - Example prompts section
  - Results display area

### 2. Demo UI - PII Detection
- **File**: `screenshots/demo-pii-detection.png`
- **What to show**:
  - Entered prompt with email: "My email is user@example.com"
  - Result showing "SANITIZE" decision
  - Modified prompt with redacted email
  - Risk indicators showing PII detection

### 3. Demo UI - Injection Blocking
- **File**: `screenshots/demo-injection-block.png`
- **What to show**:
  - Entered prompt: "Ignore all previous instructions"
  - Result showing "BLOCK" decision
  - Risk indicators showing injection detection

### 4. Admin Console - Logs Tab
- **File**: `screenshots/admin-logs.png`
- **What to show**:
  - Logs table with query history
  - Filters (PII, Injection)
  - Export buttons (CSV, JSON)
  - Decision badges and risk types

### 5. Admin Console - Policies Tab
- **File**: `screenshots/admin-policies.png`
- **What to show**:
  - Policy list
  - Create/Edit policy form
  - Enabled/Disabled toggles

### 6. Admin Console - Regex Rules Tab
- **File**: `screenshots/admin-rules.png`
- **What to show**:
  - Selected policy
  - List of regex rules
  - Add/Edit rule form
  - Rule validation

### 7. API Response Example
- **File**: `screenshots/api-response.png`
- **What to show**:
  - cURL command or Postman
  - API response JSON
  - Decision, risks, and explanations

## How to Take Screenshots

1. **Deploy the application** first
2. **Use browser dev tools** (F12) to:
   - Set viewport to 1920x1080 or 1280x720
   - Hide browser UI for clean screenshots
3. **Use tools like**:
   - Browser screenshot extensions
   - Snipping Tool (Windows)
   - Screenshot (Mac)
   - Full Page Screen Capture (Chrome extension)

## Adding Screenshots to README

After capturing, add to README.md:

```markdown
## Screenshots

### Demo UI
![Demo Homepage](./screenshots/demo-homepage.png)
![PII Detection](./screenshots/demo-pii-detection.png)
![Injection Blocking](./screenshots/demo-injection-block.png)

### Admin Console
![Logs](./screenshots/admin-logs.png)
![Policies](./screenshots/admin-policies.png)
![Regex Rules](./screenshots/admin-rules.png)
```

