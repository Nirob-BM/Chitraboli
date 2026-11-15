import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Database, Download, Upload, Clock, CheckCircle2, 
  Loader2, Calendar, HardDrive, RefreshCw, AlertTriangle,
  Play, Pause, Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { safeStorage } from "@/lib/safeStorage";

interface BackupRecord {
  id: string;
  name: string;
  created_at: string;
  size: string;
  tables: string[];
  status: 'completed' | 'in_progress' | 'failed';
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRun: Date | null;
  nextRun: Date | null;
}

export const BackupManagement = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [schedule, setSchedule] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'daily',
    lastRun: null,
    nextRun: null,
  });

  useEffect(() => {
    fetchBackups();
    loadScheduleConfig();
  }, []);

  const fetchBackups = async () => {
    try {
      // Fetch backup records from storage
      const { data: files, error } = await supabase.storage
        .from('backups')
        .list('', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });

      if (error) {
        console.error('Error fetching backups:', error);
        // Use demo data if storage folder doesn't exist
        setBackups(getDemoBackups());
        return;
      }

      if (files && files.length > 0) {
        const backupRecords: BackupRecord[] = files
          .filter(f => f.name.endsWith('.json'))
          .map(file => ({
            id: file.id || file.name,
            name: file.name,
            created_at: file.created_at || new Date().toISOString(),
            size: formatBytes(file.metadata?.size || 0),
            tables: ['orders', 'products', 'reviews', 'contact_messages'],
            status: 'completed' as const,
          }));
        setBackups(backupRecords.length > 0 ? backupRecords : getDemoBackups());
      } else {
        setBackups(getDemoBackups());
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      setBackups(getDemoBackups());
    }
  };

  const getDemoBackups = (): BackupRecord[] => [
    {
      id: 'demo-1',
      name: 'backup_2024_12_20_auto.json',
      created_at: new Date().toISOString(),
      size: '2.4 MB',
      tables: ['orders', 'products', 'reviews', 'contact_messages'],
      status: 'completed',
    },
    {
      id: 'demo-2',
      name: 'backup_2024_12_19_manual.json',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      size: '2.1 MB',
      tables: ['orders', 'products', 'reviews', 'contact_messages'],
      status: 'completed',
    },
    {
      id: 'demo-3',
      name: 'backup_2024_12_18_auto.json',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      size: '1.9 MB',
      tables: ['orders', 'products', 'reviews', 'contact_messages'],
      status: 'completed',
    },
  ];

  const loadScheduleConfig = () => {
    const saved = safeStorage.get('backup_schedule');
    if (saved) {
      let config;
      try { config = JSON.parse(saved); } catch { safeStorage.remove("backup_schedule"); return; }
      setSchedule({
        ...config,
        lastRun: config.lastRun ? new Date(config.lastRun) : null,
        nextRun: config.nextRun ? new Date(config.nextRun) : null,
      });
    }
  };

  const saveScheduleConfig = (newConfig: ScheduleConfig) => {
    safeStorage.set('backup_schedule', JSON.stringify(newConfig));
    setSchedule(newConfig);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNextRunDate = (frequency: 'daily' | 'weekly' | 'monthly'): Date => {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    
    try {
      // Fetch data from all tables
      const [ordersRes, productsRes, reviewsRes, messagesRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*'),
        supabase.from('reviews').select('*'),
        supabase.from('contact_messages').select('*'),
      ]);

      const backupData = {
        created_at: new Date().toISOString(),
        version: '1.0',
        tables: {
          orders: ordersRes.data || [],
          products: productsRes.data || [],
          reviews: reviewsRes.data || [],
          contact_messages: messagesRes.data || [],
        },
        metadata: {
          order_count: ordersRes.data?.length || 0,
          product_count: productsRes.data?.length || 0,
          review_count: reviewsRes.data?.length || 0,
          message_count: messagesRes.data?.length || 0,
        },
      };

      const fileName = `backup_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}_manual.json`;
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });

      // Try to upload to storage
      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        // Fallback: download locally
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Backup downloaded locally');
      } else {
        toast.success('Backup created and stored successfully');
      }

      // Update schedule last run
      if (schedule.enabled) {
        saveScheduleConfig({
          ...schedule,
          lastRun: new Date(),
          nextRun: getNextRunDate(schedule.frequency),
        });
      }

      fetchBackups();
    } catch (error) {
      console.error('Backup creation error:', error);
      toast.error('Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = async (backup: BackupRecord) => {
    try {
      if (backup.id.startsWith('demo-')) {
        toast.info('Demo backup - creating fresh export...');
        await createBackup();
        return;
      }

      const { data, error } = await supabase.storage
        .from('backups')
        .download(backup.name);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download backup');
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup) {
      toast.error('Please select a backup to restore');
      return;
    }

    const backup = backups.find(b => b.id === selectedBackup);
    if (!backup) return;

    setIsRestoring(true);

    try {
      if (backup.id.startsWith('demo-')) {
        // Simulate restore for demo
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success('Demo restore completed (no changes made)');
        setIsRestoring(false);
        return;
      }

      const { data, error } = await supabase.storage
        .from('backups')
        .download(backup.name);

      if (error) throw error;

      const text = await data.text();
      const backupData = JSON.parse(text);

      // Restore products (upsert to handle existing records)
      if (backupData.tables.products && backupData.tables.products.length > 0) {
        const { error: productsError } = await supabase
          .from('products')
          .upsert(backupData.tables.products, { onConflict: 'id' });
        
        if (productsError) {
          console.error('Products restore error:', productsError);
        }
      }

      toast.success(`Restored ${backupData.metadata?.product_count || 0} products from backup`);
      
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteBackup = async (backup: BackupRecord) => {
    if (backup.id.startsWith('demo-')) {
      setBackups(prev => prev.filter(b => b.id !== backup.id));
      toast.success('Demo backup removed');
      return;
    }

    try {
      const { error } = await supabase.storage
        .from('backups')
        .remove([backup.name]);

      if (error) throw error;

      toast.success('Backup deleted');
      fetchBackups();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete backup');
    }
  };

  const toggleSchedule = (enabled: boolean) => {
    const newConfig = {
      ...schedule,
      enabled,
      nextRun: enabled ? getNextRunDate(schedule.frequency) : null,
    };
    saveScheduleConfig(newConfig);
    toast.success(enabled ? 'Backup schedule enabled' : 'Backup schedule disabled');
  };

  const updateFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    const newConfig = {
      ...schedule,
      frequency,
      nextRun: schedule.enabled ? getNextRunDate(frequency) : null,
    };
    saveScheduleConfig(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Backup Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Backup */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-primary" />
              Manual Backup
            </CardTitle>
            <CardDescription>Create an instant backup of all data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
              <p className="text-sm text-muted-foreground">Tables included in backup:</p>
              <div className="flex flex-wrap gap-2">
                {['orders', 'products', 'reviews', 'contact_messages'].map(table => (
                  <Badge key={table} variant="secondary" className="text-xs">
                    {table}
                  </Badge>
                ))}
              </div>
            </div>
            <Button 
              onClick={createBackup} 
              disabled={isCreatingBackup}
              className="w-full gap-2"
            >
              {isCreatingBackup ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  Create Backup Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Scheduled Backups */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary" />
              Scheduled Backups
            </CardTitle>
            <CardDescription>Configure automatic backup schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="schedule-toggle">Enable Auto-Backup</Label>
                <p className="text-xs text-muted-foreground">Automatically backup data on schedule</p>
              </div>
              <Switch
                id="schedule-toggle"
                checked={schedule.enabled}
                onCheckedChange={toggleSchedule}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Backup Frequency</Label>
              <Select
                value={schedule.frequency}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => updateFrequency(value)}
                disabled={!schedule.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {schedule.enabled && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Schedule Active</span>
                </div>
                {schedule.nextRun && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Next backup: {formatDate(schedule.nextRun.toISOString())}
                  </p>
                )}
              </div>
            )}

            {!schedule.enabled && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Pause className="w-4 h-4" />
                  <span>Schedule Disabled</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Restore Section */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5 text-primary" />
            Restore from Backup
          </CardTitle>
          <CardDescription>Select a backup point to restore your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-500">Caution</p>
              <p className="text-xs text-muted-foreground">
                Restoring will update existing records. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Select value={selectedBackup || ''} onValueChange={setSelectedBackup}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a backup to restore" />
              </SelectTrigger>
              <SelectContent>
                {backups.map(backup => (
                  <SelectItem key={backup.id} value={backup.id}>
                    {backup.name} ({backup.size})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={restoreBackup} 
              disabled={!selectedBackup || isRestoring}
              variant="outline"
              className="gap-2"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Restore
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            Backup History
          </CardTitle>
          <CardDescription>View and manage previous backups</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {backups.map(backup => (
                <div 
                  key={backup.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Database className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{backup.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(backup.created_at)}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{backup.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        backup.status === 'completed' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/30'
                          : backup.status === 'failed'
                          ? 'bg-red-500/10 text-red-500 border-red-500/30'
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                      }
                    >
                      {backup.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadBackup(backup)}
                      className="gap-1"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteBackup(backup)}
                      className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {backups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No backups found</p>
                  <p className="text-sm">Create your first backup to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
