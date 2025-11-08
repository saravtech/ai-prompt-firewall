"""
Prompt Firewall SDK for Python

A lightweight SDK for interacting with the Prompt Firewall API.
"""

import requests
from typing import Optional, Dict, List, Any
from dataclasses import dataclass


@dataclass
class FirewallResult:
    """Result from firewall evaluation"""
    id: str
    decision: str  # 'allow', 'block', 'modify', 'sanitize'
    prompt_modified: str
    response: Optional[str]
    blocked: bool
    risks: List[Dict[str, Any]]
    explain: List[Dict[str, Any]]


class PromptFirewall:
    """Client for Prompt Firewall API"""
    
    def __init__(self, base_url: str = "http://localhost:3000", api_key: Optional[str] = None):
        """
        Initialize the Prompt Firewall client.
        
        Args:
            base_url: Base URL of the firewall API
            api_key: Optional API key for authenticated requests
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json',
        }
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'
    
    def query(self, prompt: str) -> FirewallResult:
        """
        Evaluate a prompt through the firewall.
        
        Args:
            prompt: The user's prompt to evaluate
            
        Returns:
            FirewallResult with decision, risks, and explanations
            
        Example:
            >>> firewall = PromptFirewall()
            >>> result = firewall.query("My email is user@example.com")
            >>> print(result.decision)  # 'sanitize'
            >>> print(result.risks)  # [{'type': 'pii_email', ...}]
        """
        response = requests.post(
            f"{self.base_url}/api/v1/query",
            json={"prompt": prompt},
            headers=self.headers
        )
        response.raise_for_status()
        data = response.json()
        
        if not data.get('success'):
            raise Exception(f"API error: {data.get('error')}")
        
        result_data = data['data']
        return FirewallResult(
            id=result_data['id'],
            decision=result_data['decision'],
            prompt_modified=result_data['promptModified'],
            response=result_data.get('response'),
            blocked=result_data['blocked'],
            risks=result_data.get('risks', []),
            explain=result_data.get('explain', [])
        )
    
    def get_policies(self) -> List[Dict[str, Any]]:
        """Get all firewall policies (requires authentication)"""
        response = requests.get(
            f"{self.base_url}/api/v1/policy",
            headers=self.headers
        )
        response.raise_for_status()
        data = response.json()
        return data.get('data', [])
    
    def get_logs(
        self,
        has_pii: Optional[bool] = None,
        has_injection: Optional[bool] = None,
        blocked: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get firewall logs (requires authentication)"""
        params = {'limit': limit, 'offset': offset}
        if has_pii is not None:
            params['hasPII'] = str(has_pii).lower()
        if has_injection is not None:
            params['hasInjection'] = str(has_injection).lower()
        if blocked is not None:
            params['blocked'] = str(blocked).lower()
        
        response = requests.get(
            f"{self.base_url}/api/v1/logs",
            params=params,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()


# Example usage
if __name__ == "__main__":
    # Initialize client
    firewall = PromptFirewall(base_url="http://localhost:3000")
    
    # Evaluate a prompt
    result = firewall.query("My email is sarav@example.com")
    print(f"Decision: {result.decision}")
    print(f"Modified prompt: {result.prompt_modified}")
    print(f"Risks detected: {len(result.risks)}")

