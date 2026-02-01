'use client'

import { useState } from 'react'
import { Bell, AlertTriangle, CheckCircle2, Clock, Plus, Settings, X, VolumeX, Volume2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Alert {
  id: string
  name: string
  condition: string
  severity: 'critical' | 'warning' | 'info'
  status: 'active' | 'resolved' | 'muted'
  lastTriggered: string
  triggerCount: number
  enabled: boolean
}

const initialAlerts: Alert[] = [
  {
    id: '1',
    name: 'High Error Rate',
    condition: 'Error rate > 1% for 5 minutes',
    severity: 'critical',
    status: 'active',
    lastTriggered: '2 minutes ago',
    triggerCount: 3,
    enabled: true,
  },
  {
    id: '2',
    name: 'Redis Connection Failures',
    condition: 'Redis timeout errors > 10/min',
    severity: 'critical',
    status: 'active',
    lastTriggered: '8 minutes ago',
    triggerCount: 15,
    enabled: true,
  },
  {
    id: '3',
    name: 'Slow Database Queries',
    condition: 'P99 latency > 500ms',
    severity: 'warning',
    status: 'resolved',
    lastTriggered: '1 hour ago',
    triggerCount: 7,
    enabled: true,
  },
  {
    id: '4',
    name: 'Memory Usage Warning',
    condition: 'Memory > 80% for 10 minutes',
    severity: 'warning',
    status: 'muted',
    lastTriggered: '3 hours ago',
    triggerCount: 2,
    enabled: false,
  },
]

const severityConfig = {
  critical: { color: 'bg-error', textColor: 'text-error', icon: AlertTriangle },
  warning: { color: 'bg-warning', textColor: 'text-warning', icon: AlertTriangle },
  info: { color: 'bg-info', textColor: 'text-info', icon: Bell },
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-error/10 text-error border-error/20' },
  resolved: { label: 'Resolved', color: 'bg-success/10 text-success border-success/20' },
  muted: { label: 'Muted', color: 'bg-muted text-muted-foreground border-border' },
}

function AlertCard({ 
  alert, 
  onAcknowledge, 
  onMute, 
  onDelete, 
  onToggle,
  onEdit 
}: { 
  alert: Alert
  onAcknowledge: () => void
  onMute: () => void
  onDelete: () => void
  onToggle: () => void
  onEdit: () => void
}) {
  const severity = severityConfig[alert.severity]
  const status = statusConfig[alert.status]
  const Icon = severity.icon
  
  return (
    <div className={cn(
      'bg-card border border-border rounded-lg p-5 transition-all duration-200 interactive-element',
      alert.status === 'active' && 'border-l-4 border-l-error',
      !alert.enabled && 'opacity-60'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn('p-2 rounded-lg shrink-0', alert.status === 'active' ? 'bg-error/10' : 'bg-secondary')}>
            <Icon className={cn('w-5 h-5', alert.status === 'active' ? 'text-error' : 'text-muted-foreground')} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">{alert.name}</h3>
              <Switch 
                checked={alert.enabled} 
                onCheckedChange={onToggle}
                className="scale-75"
              />
            </div>
            <p className="text-sm text-muted-foreground">{alert.condition}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", status.color)}>
                {status.label}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last: {alert.lastTriggered}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {alert.triggerCount} occurrences
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {alert.status === 'active' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAcknowledge}
              className="text-xs h-8 bg-transparent interactive-element"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Ack
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 interactive-element"
            onClick={onMute}
            title={alert.status === 'muted' ? 'Unmute' : 'Mute'}
          >
            {alert.status === 'muted' ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 interactive-element"
            onClick={onEdit}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive interactive-element"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AlertsContent() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [newAlert, setNewAlert] = useState({
    name: '',
    condition: '',
    severity: 'warning' as 'critical' | 'warning' | 'info',
  })

  const activeAlerts = alerts.filter(a => a.status === 'active')
  const otherAlerts = alerts.filter(a => a.status !== 'active')

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'resolved' as const } : a
    ))
    toast.success('Alert acknowledged')
  }

  const handleMute = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, status: a.status === 'muted' ? 'resolved' as const : 'muted' as const } : a
    ))
    const alert = alerts.find(a => a.id === id)
    toast.success(alert?.status === 'muted' ? 'Alert unmuted' : 'Alert muted')
  }

  const handleDelete = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    toast.success('Alert rule deleted')
  }

  const handleToggle = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ))
    const alert = alerts.find(a => a.id === id)
    toast.success(alert?.enabled ? 'Alert disabled' : 'Alert enabled')
  }

  const handleCreate = () => {
    if (!newAlert.name || !newAlert.condition) {
      toast.error('Please fill in all fields')
      return
    }

    const alert: Alert = {
      id: Date.now().toString(),
      name: newAlert.name,
      condition: newAlert.condition,
      severity: newAlert.severity,
      status: 'resolved',
      lastTriggered: 'Never',
      triggerCount: 0,
      enabled: true,
    }

    setAlerts(prev => [...prev, alert])
    setNewAlert({ name: '', condition: '', severity: 'warning' })
    setIsCreateOpen(false)
    toast.success('Alert rule created')
  }

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert)
  }

  const handleSaveEdit = () => {
    if (!editingAlert) return
    
    setAlerts(prev => prev.map(a => 
      a.id === editingAlert.id ? editingAlert : a
    ))
    setEditingAlert(null)
    toast.success('Alert rule updated')
  }
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Fixed */}
      <div className="p-6 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Alert Rules</h1>
            <p className="text-sm text-muted-foreground">
              Configure and manage your log alerting rules
            </p>
          </div>
          <Button className="gap-2 interactive-element" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Alert Rule
          </Button>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
              </span>
              <h2 className="text-sm font-medium text-foreground uppercase tracking-wide">
                Active Alerts ({activeAlerts.length})
              </h2>
            </div>
            <div className="space-y-3">
              {activeAlerts.map(alert => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert}
                  onAcknowledge={() => handleAcknowledge(alert.id)}
                  onMute={() => handleMute(alert.id)}
                  onDelete={() => handleDelete(alert.id)}
                  onToggle={() => handleToggle(alert.id)}
                  onEdit={() => handleEdit(alert)}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Other Alerts */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            All Rules ({otherAlerts.length})
          </h2>
          {otherAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No alert rules configured</p>
              <Button 
                variant="link" 
                onClick={() => setIsCreateOpen(true)}
                className="mt-2"
              >
                Create your first alert
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {otherAlerts.map(alert => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert}
                  onAcknowledge={() => handleAcknowledge(alert.id)}
                  onMute={() => handleMute(alert.id)}
                  onDelete={() => handleDelete(alert.id)}
                  onToggle={() => handleToggle(alert.id)}
                  onEdit={() => handleEdit(alert)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Alert Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Alert Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Alert Name</Label>
              <Input
                id="name"
                placeholder="e.g., High Error Rate"
                value={newAlert.name}
                onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Input
                id="condition"
                placeholder="e.g., Error rate > 1% for 5 minutes"
                value={newAlert.condition}
                onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select 
                value={newAlert.severity} 
                onValueChange={(value: 'critical' | 'warning' | 'info') => 
                  setNewAlert(prev => ({ ...prev, severity: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Alert Dialog */}
      <Dialog open={!!editingAlert} onOpenChange={() => setEditingAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alert Rule</DialogTitle>
          </DialogHeader>
          {editingAlert && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Alert Name</Label>
                <Input
                  id="edit-name"
                  value={editingAlert.name}
                  onChange={(e) => setEditingAlert(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-condition">Condition</Label>
                <Input
                  id="edit-condition"
                  value={editingAlert.condition}
                  onChange={(e) => setEditingAlert(prev => prev ? { ...prev, condition: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-severity">Severity</Label>
                <Select 
                  value={editingAlert.severity} 
                  onValueChange={(value: 'critical' | 'warning' | 'info') => 
                    setEditingAlert(prev => prev ? { ...prev, severity: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAlert(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
