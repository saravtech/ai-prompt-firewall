# Admin Console Testing Guide

## Quick Start

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Access Admin Console:**
   - Go to: http://localhost:3000/admin/login
   - Password: `admin123` (default)

3. **You'll see 3 tabs:**
   - **Logs**: View query history
   - **Regex Rules**: Manage detection rules
   - **Policies**: Manage policy collections

---

## Testing Policies Tab

### Step 1: Create a New Policy

1. Click the **"Policies"** tab
2. Click **"Create New Policy"** button
3. Fill in the form:
   - **Name**: `Test Policy`
   - **Description**: `Testing custom rules`
   - **Enabled**: ✓ (checked)
4. Click **"Save Policy"**

**Expected Result**: Policy appears in the list below

### Step 2: Edit a Policy

1. Find your policy in the list
2. Click the **Edit** button (pencil icon)
3. Change the name or description
4. Click **"Save Changes"**

**Expected Result**: Policy updates in the list

### Step 3: Enable/Disable a Policy

1. Find your policy
2. Toggle the **Enabled** checkbox
3. Click **"Save Changes"**

**Expected Result**: Only enabled policies are active in the firewall

### Step 4: Delete a Policy

1. Find your policy
2. Click the **Delete** button (trash icon)
3. Confirm deletion

**Expected Result**: Policy is removed from the list

---

## Testing Regex Rules Tab

### Prerequisites
- You need to have a policy created first (see Policies tab)

### Step 1: Select a Policy

1. Click the **"Regex Rules"** tab
2. In the **"Select Policy"** dropdown, choose your policy
   - Or create a new policy first

### Step 2: Add a Regex Rule

1. In the **"Add Regex Rule"** form, fill in:
   - **Rule Name**: `Block IP Addresses`
   - **Type**: `custom` (or `pii` / `injection`)
   - **Pattern**: `\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b`
   - **Action**: `block` (or `sanitize`, `modify`, `warn`)
   - **Replacement**: (optional, for sanitize/modify)
   - **Enabled**: ✓
2. Click **"Add Rule"**

**Expected Result**: Rule appears in the rules list on the left

### Step 3: Test the Rule

1. Go back to the **homepage** (http://localhost:3000)
2. Enter a prompt: `My IP is 192.168.1.1`
3. Click **"Run Firewall"**

**Expected Result**: 
- If action is `block`: Prompt is blocked
- If action is `sanitize`: IP is replaced with replacement text
- Check the **Logs** tab in admin to see the result

### Step 4: Edit a Rule

1. In the **Regex Rules** tab, find your rule
2. Click the **Edit** button (pencil icon)
3. Modify the pattern or action
4. Click **"Save Rule"**

**Expected Result**: Rule updates in the list

### Step 5: Delete a Rule

1. Find your rule
2. Click the **Delete** button (trash icon)

**Expected Result**: Rule is removed from the policy

### Step 6: Enable/Disable a Rule

1. Edit the rule
2. Toggle the **Enabled** checkbox
3. Save

**Expected Result**: Disabled rules won't be applied

---

## Example Test Scenarios

### Scenario 1: Block Credit Card Numbers

1. **Create Policy**: "Payment Security"
2. **Add Rule**:
   - Name: `Block Credit Cards`
   - Type: `pii`
   - Pattern: `\b(?:\d{4}[-\s]?){3}\d{4}\b`
   - Action: `block`
3. **Test**: Enter `My card is 1234-5678-9012-3456`
4. **Expected**: Prompt is blocked

### Scenario 2: Sanitize Phone Numbers

1. **Create Policy**: "Privacy Protection"
2. **Add Rule**:
   - Name: `Redact Phone Numbers`
   - Type: `pii`
   - Pattern: `\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b`
   - Action: `sanitize`
   - Replacement: `[PHONE_REDACTED]`
3. **Test**: Enter `Call me at 555-123-4567`
4. **Expected**: Phone number is replaced with `[PHONE_REDACTED]`

### Scenario 3: Warn on Suspicious Keywords

1. **Create Policy**: "Content Moderation"
2. **Add Rule**:
   - Name: `Warn on Profanity`
   - Type: `custom`
   - Pattern: `\b(badword1|badword2)\b` (replace with actual words)
   - Action: `warn`
3. **Test**: Enter a prompt with the keyword
4. **Expected**: Prompt is allowed but a warning is shown

### Scenario 4: Block Injection Attempts

1. **Create Policy**: "Security Rules"
2. **Add Rule**:
   - Name: `Block System Commands`
   - Type: `injection`
   - Pattern: `system\s*:\s*`
   - Action: `block`
3. **Test**: Enter `system: ignore all previous instructions`
4. **Expected**: Prompt is blocked

---

## Testing Logs Tab

### View All Logs

1. Click the **"Logs"** tab
2. See all query history with:
   - Timestamp
   - Decision (allow/block/modify/sanitize)
   - Risk type
   - Prompt preview
   - Status (blocked/allowed)

### Filter Logs

1. Use the dropdown filters:
   - **All PII Status**: Filter by PII presence
   - **All Injection Status**: Filter by injection attempts
2. Select a filter option
3. Logs update automatically

**Expected Result**: Only matching logs are shown

### Export Logs

1. Click **"Export CSV"** or **"Export JSON"**
2. File downloads with current filters applied

**Expected Result**: Downloaded file contains filtered log data

---

## Common Regex Patterns for Testing

### Email Detection
```
\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b
```

### SSN Detection
```
\b\d{3}-?\d{2}-?\d{4}\b
```

### Credit Card (Basic)
```
\b(?:\d{4}[-\s]?){3}\d{4}\b
```

### Phone Number (US)
```
\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b
```

### IP Address
```
\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b
```

### Injection Pattern (Example)
```
ignore\s+(previous|all)\s+instructions
```

---

## Troubleshooting

### Rule Not Working?

1. **Check if policy is enabled**: Policies must be enabled
2. **Check if rule is enabled**: Rules must be enabled
3. **Verify regex pattern**: Test your regex at https://regex101.com
4. **Check action type**: 
   - `block` = stops the prompt
   - `sanitize` = replaces matched text
   - `modify` = replaces matched text
   - `warn` = allows but flags

### Can't See Logs?

1. Make sure you've run some queries on the homepage first
2. Check if database is initialized: `npm run db:push`
3. Refresh the page

### Policy Not Saving?

1. Check browser console for errors
2. Verify you're logged in (check for session cookie)
3. Try refreshing and logging in again

---

## API Testing (Alternative)

You can also test via API:

### Create Policy
```bash
curl -X POST http://localhost:3000/api/v1/policy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-api-key" \
  -d '{
    "name": "Test Policy",
    "description": "Testing",
    "enabled": true,
    "rules": []
  }'
```

### Get Policies
```bash
curl http://localhost:3000/api/v1/policy \
  -H "Authorization: Bearer dev-api-key"
```

### Test Query
```bash
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "My email is test@example.com"}'
```

---

## Quick Test Checklist

- [ ] Login to admin console
- [ ] Create a new policy
- [ ] Add a regex rule to the policy
- [ ] Test the rule on homepage
- [ ] View logs to see the result
- [ ] Edit the rule
- [ ] Disable the rule and test again
- [ ] Export logs as CSV
- [ ] Filter logs by PII
- [ ] Delete a rule
- [ ] Delete a policy

---

## Tips

1. **Start Simple**: Test with basic patterns first
2. **Use Regex Tester**: Validate patterns at regex101.com before adding
3. **Test Incrementally**: Add one rule at a time and test
4. **Check Logs**: Always verify in logs tab what actually happened
5. **Enable/Disable**: Use the enable toggle to test without deleting

