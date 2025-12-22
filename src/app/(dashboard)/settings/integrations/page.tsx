'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, RefreshCw, Trash2, CheckCircle, XCircle, AlertCircle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GhlConnection, GhlPipeline, GhlPipelineStage } from '@/types/database';

// Temporary tenant ID - in production, this would come from auth context
const TEMP_TENANT_ID = 'tenant_demo';

interface ConnectionWithHidden extends Omit<GhlConnection, 'apiKey' | 'accessToken' | 'refreshToken' | 'webhookSecret'> {
  apiKey: string;
  accessToken: string | null;
  refreshToken: string | null;
  webhookSecret: string | null;
}

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<ConnectionWithHidden[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  // New connection form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocationId, setNewLocationId] = useState('');
  const [newApiKey, setNewApiKey] = useState('');

  // Pipeline mapping state
  const [pipelines, setPipelines] = useState<Record<string, GhlPipeline[]>>({});
  const [editingMapping, setEditingMapping] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch(`/api/ghl/connections?tenantId=${TEMP_TENANT_ID}`);
      const data = await res.json();
      if (data.connections) {
        setConnections(data.connections);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const addConnection = async () => {
    if (!newLocationId || !newApiKey) {
      toast.error('Location ID and API Key are required');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/ghl/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEMP_TENANT_ID,
          locationId: newLocationId,
          apiKey: newApiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add connection');
      }

      toast.success('Connection added successfully');
      setShowAddForm(false);
      setNewLocationId('');
      setNewApiKey('');
      fetchConnections();

      // Store pipelines for this connection
      if (data.pipelines) {
        setPipelines(prev => ({
          ...prev,
          [data.connection.id]: data.pipelines,
        }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add connection');
    } finally {
      setAdding(false);
    }
  };

  const deleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      const res = await fetch(`/api/ghl/connections?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete connection');
      }

      toast.success('Connection deleted');
      fetchConnections();
    } catch (error) {
      toast.error('Failed to delete connection');
    }
  };

  const syncConnection = async (connectionId: string) => {
    setSyncing(connectionId);
    try {
      const res = await fetch('/api/ghl/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          syncType: 'full',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      toast.success(`Synced ${data.synced.contacts} contacts and ${data.synced.opportunities} opportunities`);
      fetchConnections();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const fetchPipelines = async (connectionId: string) => {
    try {
      const res = await fetch(`/api/ghl/connections/pipelines?connectionId=${connectionId}`);
      const data = await res.json();
      if (data.pipelines) {
        setPipelines(prev => ({
          ...prev,
          [connectionId]: data.pipelines,
        }));
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    }
  };

  const updateStageMapping = async (connectionId: string, mapping: Record<string, string>) => {
    try {
      const res = await fetch('/api/ghl/connections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: connectionId,
          stageMapping: mapping,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update mapping');
      }

      toast.success('Stage mapping updated');
      fetchConnections();
      setEditingMapping(null);
    } catch (error) {
      toast.error('Failed to update mapping');
    }
  };

  const getSyncStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your GoHighLevel account to sync leads automatically
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </div>

      {/* Add Connection Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Connect GoHighLevel</CardTitle>
            <CardDescription>
              Enter your GHL Location ID and API Key to connect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="locationId">Location ID</Label>
                <Input
                  id="locationId"
                  placeholder="e.g., abc123xyz..."
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Your GHL API Key"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addConnection} disabled={adding}>
                {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Connect
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewLocationId('');
                  setNewApiKey('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connections List */}
      {connections.length === 0 && !showAddForm ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No integrations yet</h3>
            <p className="text-muted-foreground mb-4">
              Connect your GoHighLevel account to start syncing leads
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => (
            <Card key={conn.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">{conn.locationName}</CardTitle>
                  <CardDescription>Location ID: {conn.locationId}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={conn.isActive ? 'default' : 'secondary'}>
                    {conn.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncConnection(conn.id)}
                    disabled={syncing === conn.id}
                  >
                    {syncing === conn.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteConnection(conn.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Sync Status */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Sync Status</Label>
                    <div className="flex items-center gap-2">
                      {getSyncStatusIcon(conn.lastSyncStatus)}
                      <span className="text-sm">
                        {conn.lastSyncAt
                          ? `Last synced: ${new Date(conn.lastSyncAt).toLocaleString()}`
                          : 'Never synced'}
                      </span>
                    </div>
                    {conn.lastSyncError && (
                      <p className="text-sm text-red-500">{conn.lastSyncError}</p>
                    )}
                  </div>

                  {/* Webhook Status */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Webhook</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={conn.webhookEnabled}
                        onCheckedChange={async (enabled) => {
                          await fetch('/api/ghl/connections', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: conn.id,
                              webhookEnabled: enabled,
                            }),
                          });
                          fetchConnections();
                        }}
                      />
                      <span className="text-sm">
                        {conn.webhookEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stage Mapping */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Pipeline Stage Mapping</Label>
                    {editingMapping !== conn.id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingMapping(conn.id);
                          if (!pipelines[conn.id]) {
                            fetchPipelines(conn.id);
                          }
                        }}
                      >
                        Configure
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingMapping(null)}
                      >
                        Close
                      </Button>
                    )}
                  </div>

                  {editingMapping === conn.id && pipelines[conn.id] && (
                    <div className="space-y-3 mt-3">
                      {pipelines[conn.id].map((pipeline) => (
                        <div key={pipeline.id} className="space-y-2">
                          <Label className="text-sm">{pipeline.name}</Label>
                          <div className="grid gap-2 md:grid-cols-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Won Stage</Label>
                              <Select
                                value={conn.stageMapping?.won_stage_id || ''}
                                onValueChange={(value) => {
                                  updateStageMapping(conn.id, {
                                    ...conn.stageMapping,
                                    won_stage_id: value,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select stage" />
                                </SelectTrigger>
                                <SelectContent>
                                  {pipeline.stages.map((stage) => (
                                    <SelectItem key={stage.id} value={stage.id}>
                                      {stage.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Lost Stage</Label>
                              <Select
                                value={conn.stageMapping?.lost_stage_id || ''}
                                onValueChange={(value) => {
                                  updateStageMapping(conn.id, {
                                    ...conn.stageMapping,
                                    lost_stage_id: value,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select stage" />
                                </SelectTrigger>
                                <SelectContent>
                                  {pipeline.stages.map((stage) => (
                                    <SelectItem key={stage.id} value={stage.id}>
                                      {stage.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Estimate Sent Stage</Label>
                              <Select
                                value={conn.stageMapping?.estimate_stage_id || ''}
                                onValueChange={(value) => {
                                  updateStageMapping(conn.id, {
                                    ...conn.stageMapping,
                                    estimate_stage_id: value,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select stage" />
                                </SelectTrigger>
                                <SelectContent>
                                  {pipeline.stages.map((stage) => (
                                    <SelectItem key={stage.id} value={stage.id}>
                                      {stage.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!editingMapping && conn.stageMapping && Object.keys(conn.stageMapping).length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(conn.stageMapping).length} stages mapped
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Webhook URL Info */}
      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Webhook Configuration</CardTitle>
            <CardDescription>
              Add this webhook URL to your GoHighLevel workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/ghl/webhook`}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/ghl/webhook`);
                  toast.success('Copied to clipboard');
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Configure your GHL workflow to send webhook events to this URL for real-time lead syncing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
