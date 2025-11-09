'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Shield, ArrowLeft, Trash2, Save, Plus, Filter, Edit2, X, Download } from 'lucide-react';
import type { FirewallRule } from '@/lib/firewall';

interface Log {
  id: string;
  prompt: string;
  response: string | null;
  timestamp: string;
  hasPII: boolean;
  hasInjection: boolean;
  piiTypes: string[];
  riskScore: number;
  blocked: boolean;
  decision?: string;
  risks?: any[];
  metadata: any;
}

interface Policy {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rules: FirewallRule[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ hasPII: '', hasInjection: '' });
  
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [newPolicy, setNewPolicy] = useState({ name: '', description: '', enabled: true, rules: [] as FirewallRule[] });
  
  // Rule management state
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<FirewallRule>>({
    name: '',
    enabled: true,
    type: 'custom',
    action: 'block',
    pattern: '',
    replacement: '',
  });

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        setAuthenticated(data.authenticated);
        setCheckingAuth(false);
        if (data.authenticated) {
          loadLogs();
          loadPolicies();
        } else {
          window.location.href = '/admin/login';
        }
      } catch {
        setCheckingAuth(false);
        window.location.href = '/admin/login';
      }
    };
    
    checkAuth();
  }, []);
  
  useEffect(() => {
    if (authenticated) {
      loadLogs();
      loadPolicies();
    }
  }, [filter, authenticated]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { 
        method: 'DELETE',
        credentials: 'include',
      });
      // Clear local state
      setAuthenticated(false);
      // Redirect to login
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API call fails
      window.location.href = '/admin/login';
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.hasPII) params.append('hasPII', filter.hasPII);
      if (filter.hasInjection) params.append('hasInjection', filter.hasInjection);

      const response = await fetch(`/api/logs?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('Failed to load logs:', response.status, response.statusText);
        if (response.status === 401) {
          console.error('⚠️ Not authenticated - redirecting to login');
          window.location.href = '/admin/login';
          return;
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setLogs([]);
        return;
      }
      
      const data = await response.json();
      console.log('📊 Logs loaded:', data.data?.length || 0, 'logs');
      if (data.success) {
        setLogs(data.data || []);
      } else {
        console.error('API returned error:', data.error);
        setLogs([]);
      }
    } catch (error) {
      console.error('❌ Failed to load logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPolicies = async () => {
    try {
      const response = await fetch('/api/policy', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load policies:', response.status, errorText);
        // If unauthorized, redirect to login
        if (response.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setPolicies(data.data || []);
      } else {
        console.error('Failed to load policies:', data.error, data.details);
        // Still set empty array so UI doesn't break
        setPolicies([]);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
      setPolicies([]); // Set empty array on error
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      const response = await fetch(`/api/policy?id=${id}`, { 
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        loadPolicies();
      } else {
        alert(`Error: ${data.error || 'Failed to delete policy'}`);
      }
    } catch (error) {
      console.error('Failed to delete policy:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete policy'}`);
    }
  };

  const handleSavePolicy = async () => {
    if (!newPolicy.name) {
      alert('Policy name is required');
      return;
    }
    
    try {
      if (editingPolicy) {
        const response = await fetch('/api/policy', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: editingPolicy.id,
            ...newPolicy,
          }),
        });
        const data = await response.json();
        if (data.success) {
          setEditingPolicy(null);
          setNewPolicy({ name: '', description: '', enabled: true, rules: [] });
          loadPolicies();
        } else {
          alert(`Error: ${data.error || 'Failed to update policy'}`);
        }
      } else {
        const response = await fetch('/api/policy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newPolicy),
        });
        const data = await response.json();
        if (data.success) {
          setNewPolicy({ name: '', description: '', enabled: true, rules: [] });
          loadPolicies();
        } else {
          alert(`Error: ${data.error || 'Failed to create policy'}\n${data.details || ''}`);
        }
      }
    } catch (error) {
      console.error('Failed to save policy:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save policy'}`);
    }
  };

  const handleAddRule = () => {
    if (!newRule.name || !newRule.pattern) {
      alert('Name and pattern are required');
      return;
    }

    const rule: FirewallRule = {
      id: `rule_${Date.now()}`,
      name: newRule.name!,
      enabled: newRule.enabled ?? true,
      type: newRule.type || 'custom',
      pattern: newRule.pattern,
      action: newRule.action || 'block',
      replacement: newRule.replacement,
    };

    // Validate regex pattern
    try {
      if (!rule.pattern) {
        alert('Pattern is required');
        return;
      }
      new RegExp(rule.pattern);
    } catch (error) {
      alert('Invalid regex pattern: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return;
    }

    const updatedRules = [...(editingPolicy?.rules || newPolicy.rules), rule];
    if (editingPolicy) {
      setNewPolicy({ ...newPolicy, rules: updatedRules });
    } else {
      setNewPolicy({ ...newPolicy, rules: updatedRules });
    }

    // Reset rule form
    setNewRule({
      name: '',
      enabled: true,
      type: 'custom',
      action: 'block',
      pattern: '',
      replacement: '',
    });
  };

  const handleEditRule = (rule: FirewallRule) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      enabled: rule.enabled,
      type: rule.type,
      pattern: rule.pattern,
      action: rule.action,
      replacement: rule.replacement,
    });
  };

  const handleUpdateRule = () => {
    if (!editingRule || !newRule.name || !newRule.pattern) {
      alert('Name and pattern are required');
      return;
    }

    // Validate regex pattern
    try {
      if (!newRule.pattern) {
        alert('Pattern is required');
        return;
      }
      new RegExp(newRule.pattern);
    } catch (error) {
      alert('Invalid regex pattern: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return;
    }

    const updatedRule: FirewallRule = {
      ...editingRule,
      name: newRule.name!,
      enabled: newRule.enabled ?? editingRule.enabled,
      type: newRule.type || editingRule.type,
      pattern: newRule.pattern,
      action: newRule.action || editingRule.action,
      replacement: newRule.replacement,
    };

    const currentRules = editingPolicy?.rules || newPolicy.rules;
    const updatedRules = currentRules.map((r) => (r.id === editingRule.id ? updatedRule : r));
    
    if (editingPolicy) {
      setNewPolicy({ ...newPolicy, rules: updatedRules });
    } else {
      setNewPolicy({ ...newPolicy, rules: updatedRules });
    }

    setEditingRule(null);
    setNewRule({
      name: '',
      enabled: true,
      type: 'custom',
      action: 'block',
      pattern: '',
      replacement: '',
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    const currentRules = editingPolicy?.rules || newPolicy.rules;
    const updatedRules = currentRules.filter((r) => r.id !== ruleId);
    
    if (editingPolicy) {
      setNewPolicy({ ...newPolicy, rules: updatedRules });
    } else {
      setNewPolicy({ ...newPolicy, rules: updatedRules });
    }
  };

  const getDecisionColor = (decision?: string) => {
    switch (decision) {
      case 'block':
        return 'destructive';
      case 'sanitize':
      case 'modify':
        return 'default';
      case 'allow':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRiskType = (log: Log): string => {
    if (log.hasInjection) return 'injection';
    if (log.hasPII) {
      if (log.piiTypes.includes('ssn')) return 'pii_ssn';
      if (log.piiTypes.includes('email')) return 'pii_email';
      if (log.piiTypes.includes('phone')) return 'pii_phone';
      if (log.piiTypes.includes('credit_card')) return 'pii_credit_card';
      return 'pii';
    }
    return 'none';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Console</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Demo
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="rules">Regex Rules</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Query Logs</CardTitle>
                    <CardDescription>View and filter all prompt queries</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (filter.hasPII) params.append('hasPII', filter.hasPII);
                        if (filter.hasInjection) params.append('hasInjection', filter.hasInjection);
                        params.append('format', 'csv');
                        window.open(`/api/logs?${params.toString()}`, '_blank');
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (filter.hasPII) params.append('hasPII', filter.hasPII);
                        if (filter.hasInjection) params.append('hasInjection', filter.hasInjection);
                        params.append('format', 'json');
                        window.open(`/api/logs?${params.toString()}`, '_blank');
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <select
                    className="px-3 py-2 bg-background border border-input rounded-md text-sm"
                    value={filter.hasPII}
                    onChange={(e) => setFilter({ ...filter, hasPII: e.target.value })}
                  >
                    <option value="">All PII Status</option>
                    <option value="true">Has PII</option>
                    <option value="false">No PII</option>
                  </select>
                  <select
                    className="px-3 py-2 bg-background border border-input rounded-md text-sm"
                    value={filter.hasInjection}
                    onChange={(e) => setFilter({ ...filter, hasInjection: e.target.value })}
                  >
                    <option value="">All Injection Status</option>
                    <option value="true">Has Injection</option>
                    <option value="false">No Injection</option>
                  </select>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No logs found</div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Decision</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Prompt</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => {
                          const decision = log.decision || (log.blocked ? 'block' : 'allow');
                          const type = getRiskType(log);
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(log.timestamp)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getDecisionColor(decision)}>
                                  {decision.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={type === 'none' ? 'outline' : 'secondary'}>
                                  {type === 'none' ? 'safe' : type}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-md">
                                <div className="truncate font-mono text-sm" title={log.prompt}>
                                  {log.prompt}
                                </div>
                              </TableCell>
                              <TableCell>
                                {log.blocked ? (
                                  <Badge variant="destructive">Blocked</Badge>
                                ) : (
                                  <Badge variant="outline">Allowed</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regex Rules</CardTitle>
                  <CardDescription>
                    {editingPolicy
                      ? `Rules in "${editingPolicy.name}"`
                      : newPolicy.name
                      ? `Rules in "${newPolicy.name}" (unsaved)`
                      : 'Select or create a policy to manage rules'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(!editingPolicy && !newPolicy.name) ? (
                    <div className="space-y-4">
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="mb-2">No policy selected</p>
                        <p className="text-xs">Go to the "Policies" tab to create or select a policy, then return here to add rules.</p>
                      </div>
                      {/* <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Or create a new policy:</p>
                        <Input
                          value={newPolicy.name}
                          onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                          placeholder="Enter policy name to start adding rules"
                          className="mb-2"
                        />
                        <Textarea
                          value={newPolicy.description}
                          onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                          placeholder="Policy description (optional)"
                          rows={2}
                        />
                      </div> */}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(editingPolicy?.rules || newPolicy.rules || []).map((rule) => (
                        <div
                          key={rule.id}
                          className="p-4 border rounded-md space-y-2 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{rule.name}</h3>
                                <Badge variant={rule.enabled ? 'default' : 'secondary'} className="text-xs">
                                  {rule.enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {rule.type}
                                </Badge>
                              </div>
                              <div className="text-xs font-mono text-muted-foreground mb-1">
                                Pattern: {rule.pattern}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Action: {rule.action}
                                {rule.replacement && ` → "${rule.replacement}"`}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRule(rule)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(editingPolicy?.rules || newPolicy.rules || []).length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No rules yet. Add one below.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingRule ? 'Edit Rule' : 'Add Regex Rule'}
                  </CardTitle>
                  <CardDescription>
                    {editingRule
                      ? 'Update the regex rule'
                      : 'Create a new regex detection rule'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rule Name</label>
                    <Input
                      value={newRule.name || ''}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      placeholder="e.g., Block Credit Cards"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <select
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                      value={newRule.type || 'custom'}
                      onChange={(e) => setNewRule({ ...newRule, type: e.target.value as any })}
                    >
                      <option value="pii">PII</option>
                      <option value="injection">Injection</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Regex Pattern <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={newRule.pattern || ''}
                      onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                      placeholder="e.g., \\b\\d{3}-?\\d{2}-?\\d{4}\\b"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JavaScript regex pattern (use \\ for escaping)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Action</label>
                    <select
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                      value={newRule.action || 'block'}
                      onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                    >
                      <option value="block">Block</option>
                      <option value="sanitize">Sanitize</option>
                      <option value="modify">Modify</option>
                      <option value="warn">Warn</option>
                    </select>
                  </div>
                  {(newRule.action === 'sanitize' || newRule.action === 'modify') && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Replacement</label>
                      <Input
                        value={newRule.replacement || ''}
                        onChange={(e) => setNewRule({ ...newRule, replacement: e.target.value })}
                        placeholder="e.g., [REDACTED]"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rule-enabled"
                      checked={newRule.enabled ?? true}
                      onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="rule-enabled" className="text-sm">
                      Enabled
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={editingRule ? handleUpdateRule : handleAddRule}
                      className="flex-1"
                      disabled={!newRule.name || !newRule.pattern}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {editingRule ? 'Update' : 'Add'} Rule
                    </Button>
                    {editingRule && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingRule(null);
                          setNewRule({
                            name: '',
                            enabled: true,
                            type: 'custom',
                            action: 'block',
                            pattern: '',
                            replacement: '',
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Policies</CardTitle>
                  <CardDescription>Manage detection policies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {policies.map((policy) => (
                      <div
                        key={policy.id}
                        className="p-4 border rounded-md space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setEditingPolicy(policy);
                          setNewPolicy({
                            name: policy.name,
                            description: policy.description || '',
                            enabled: policy.enabled,
                            rules: policy.rules,
                          });
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{policy.name}</h3>
                            {policy.description && (
                              <p className="text-sm text-muted-foreground">{policy.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {policy.rules.length} rule{policy.rules.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                              {policy.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePolicy(policy.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {policies.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No policies yet. Create one to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingPolicy ? 'Edit Policy' : 'Create Policy'}
                  </CardTitle>
                  <CardDescription>
                    {editingPolicy
                      ? 'Update detection policy'
                      : 'Add a new detection policy'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <Input
                      value={newPolicy.name}
                      onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                      placeholder="Policy name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={newPolicy.description}
                      onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                      placeholder="Policy description"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={newPolicy.enabled}
                      onChange={(e) => setNewPolicy({ ...newPolicy, enabled: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="enabled" className="text-sm">
                      Enabled
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rules: {newPolicy.rules.length} rule{newPolicy.rules.length !== 1 ? 's' : ''} configured
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSavePolicy} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {editingPolicy ? 'Update' : 'Create'}
                    </Button>
                    {editingPolicy && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingPolicy(null);
                          setNewPolicy({ name: '', description: '', enabled: true, rules: [] });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
