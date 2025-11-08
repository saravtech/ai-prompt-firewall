/**
 * Prompt Firewall SDK for JavaScript/Node.js
 * 
 * A lightweight SDK for interacting with the Prompt Firewall API.
 */

class PromptFirewall {
  /**
   * Initialize the Prompt Firewall client
   * @param {string} baseUrl - Base URL of the firewall API
   * @param {string} apiKey - Optional API key for authenticated requests
   */
  constructor(baseUrl = 'http://localhost:3000', apiKey = null) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.headers = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      this.headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  /**
   * Evaluate a prompt through the firewall
   * @param {string} prompt - The user's prompt to evaluate
   * @returns {Promise<Object>} FirewallResult with decision, risks, and explanations
   * 
   * @example
   * const firewall = new PromptFirewall();
   * const result = await firewall.query("My email is user@example.com");
   * console.log(result.decision); // 'sanitize'
   * console.log(result.risks); // [{type: 'pii_email', ...}]
   */
  async query(prompt) {
    const response = await fetch(`${this.baseUrl}/api/v1/query`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(`API error: ${data.error}`);
    }

    return data.data;
  }

  /**
   * Get all firewall policies (requires authentication)
   * @returns {Promise<Array>} List of policies
   */
  async getPolicies() {
    const response = await fetch(`${this.baseUrl}/api/v1/policy`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get firewall logs (requires authentication)
   * @param {Object} filters - Optional filters
   * @param {boolean} filters.hasPII - Filter by PII presence
   * @param {boolean} filters.hasInjection - Filter by injection presence
   * @param {boolean} filters.blocked - Filter by blocked status
   * @param {number} filters.limit - Number of results (default: 100)
   * @param {number} filters.offset - Pagination offset (default: 0)
   * @returns {Promise<Object>} Logs with pagination info
   */
  async getLogs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.hasPII !== undefined) params.append('hasPII', filters.hasPII);
    if (filters.hasInjection !== undefined) params.append('hasInjection', filters.hasInjection);
    if (filters.blocked !== undefined) params.append('blocked', filters.blocked);
    params.append('limit', filters.limit || 100);
    params.append('offset', filters.offset || 0);

    const response = await fetch(`${this.baseUrl}/api/v1/logs?${params}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptFirewall;
}

// Example usage
if (typeof window !== 'undefined') {
  window.PromptFirewall = PromptFirewall;
}

