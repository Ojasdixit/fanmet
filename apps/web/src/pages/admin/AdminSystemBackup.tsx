import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface TableStats {
  name: string;
  rowCount: number;
  size: string;
}

interface DatabaseInfo {
  totalTables: number;
  totalRows: number;
  projectId: string;
  region: string;
}

export function AdminSystemBackup() {
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [dbInfo, setDbInfo] = useState<DatabaseInfo>({
    totalTables: 0,
    totalRows: 0,
    projectId: 'iktldcrkyphkvxjwmxyb',
    region: 'ap-south-1',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchDatabaseStats = async () => {
    setIsLoading(true);
    try {
      // Get table row counts
      const tables = ['users', 'events', 'bids', 'meets', 'profiles', 'notifications', 
                      'support_tickets', 'withdrawal_requests', 'wallet_transactions',
                      'reports', 'disputes', 'audit_logs', 'bulk_actions'];
      
      const stats: TableStats[] = [];
      let totalRows = 0;

      for (const tableName of tables) {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          const rowCount = count ?? 0;
          totalRows += rowCount;
          stats.push({
            name: tableName,
            rowCount,
            size: `~${Math.max(1, Math.round(rowCount * 0.5))} KB`,
          });
        }
      }

      // Sort by row count descending
      stats.sort((a, b) => b.rowCount - a.rowCount);

      setTableStats(stats);
      setDbInfo({
        totalTables: stats.length,
        totalRows,
        projectId: 'iktldcrkyphkvxjwmxyb',
        region: 'ap-south-1',
      });
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDatabaseStats();
  }, []);

  const handleExportTable = async (tableName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1000);

      if (error) {
        alert(`Failed to export ${tableName}: ${error.message}`);
        return;
      }

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${tableName}_export_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAll = async () => {
    const confirmed = window.confirm('Export all tables? This may take a moment.');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const allData: Record<string, any[]> = {};

      for (const table of tableStats) {
        const { data } = await supabase
          .from(table.name)
          .select('*')
          .limit(1000);

        if (data) {
          allData[table.name] = data;
        }
      }

      const jsonContent = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `full_database_export_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Full database export completed!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Database Backup</h1>
          <p className="text-sm text-[#6C757D]">
            View database statistics and export data.
            {lastRefresh && ` Last refreshed: ${formatDateTime(lastRefresh.toISOString())}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportAll} disabled={isLoading}>
            Export All Tables
          </Button>
          <Button onClick={fetchDatabaseStats} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh Stats'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-center">
          <p className="text-3xl font-bold text-[#212529]">{dbInfo.totalTables}</p>
          <p className="text-sm text-[#6C757D]">Tables</p>
        </div>
        <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-center">
          <p className="text-3xl font-bold text-[#C045FF]">{dbInfo.totalRows.toLocaleString()}</p>
          <p className="text-sm text-[#6C757D]">Total Rows</p>
        </div>
        <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-center">
          <p className="text-lg font-bold text-[#212529]">{dbInfo.projectId.slice(0, 8)}...</p>
          <p className="text-sm text-[#6C757D]">Project ID</p>
        </div>
        <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-center">
          <p className="text-lg font-bold text-[#212529]">{dbInfo.region}</p>
          <p className="text-sm text-[#6C757D]">Region</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Supabase Managed Backups" subtitle="Automatic daily backups handled by Supabase" />
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[16px] border border-[#28A745]/30 bg-[#28A745]/10 p-5 text-sm">
            <p className="font-semibold text-[#28A745]">Daily Backups</p>
            <p className="mt-2 text-[#6C757D]">Automatic daily point-in-time recovery enabled</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
            <p className="font-semibold">Retention</p>
            <p className="mt-2 text-[#6C757D]">7 days (Free tier) / 30 days (Pro)</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
            <p className="font-semibold">PITR</p>
            <p className="mt-2 text-[#6C757D]">Point-in-time recovery available</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Table Statistics" subtitle={`${tableStats.length} tables · Export individual tables`} />
        <CardContent className="overflow-x-auto text-sm">
          <table className="min-w-full table-auto border-collapse text-left">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Table</th>
                <th className="border-b border-[#E9ECEF] py-3">Rows</th>
                <th className="border-b border-[#E9ECEF] py-3">Est. Size</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableStats.map((table) => (
                <tr key={table.name} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529] font-medium">{table.name}</td>
                  <td className="py-3 text-[#6C757D]">{table.rowCount.toLocaleString()}</td>
                  <td className="py-3 text-[#6C757D]">{table.size}</td>
                  <td className="py-3">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleExportTable(table.name)}
                      disabled={isLoading}
                    >
                      Export JSON
                    </Button>
                  </td>
                </tr>
              ))}
              {tableStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading table statistics...' : 'No tables found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Backup Notes" subtitle="Important information about data protection" />
        <CardContent className="space-y-3 text-sm text-[#6C757D]">
          <p>
            <strong className="text-[#212529]">Automatic Backups:</strong> Supabase automatically handles daily backups and point-in-time recovery. 
            No manual intervention is needed for standard backup operations.
          </p>
          <p>
            <strong className="text-[#212529]">Manual Exports:</strong> Use the export buttons above to download JSON snapshots of individual tables 
            or the entire database for local backups or data analysis.
          </p>
          <p>
            <strong className="text-[#212529]">Restore:</strong> To restore from a backup, contact Supabase support or use the Supabase Dashboard 
            to access point-in-time recovery options.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
