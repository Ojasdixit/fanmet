import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppShell } from './layouts/AppShell';
import { DashboardShell } from './layouts/DashboardShell';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/auth/AuthPage';
import { FanDashboard } from './pages/fan/FanDashboard';
import { FanBids } from './pages/fan/FanBids';
import { FanMeets } from './pages/fan/FanMeets';
import { FanWallet } from './pages/fan/FanWallet';
import { FanHistory } from './pages/fan/FanHistory';
import { FanNotifications } from './pages/fan/FanNotifications';
import { FanSettings } from './pages/fan/FanSettings';
import { CreatorOverview } from './pages/creator/CreatorOverview';
import { CreatorEvents } from './pages/creator/CreatorEvents';
import { CreatorCreateEvent } from './pages/creator/CreatorCreateEvent';
import { CreatorEarnings } from './pages/creator/CreatorEarnings';
import { CreatorWithdrawals } from './pages/creator/CreatorWithdrawals';
import { CreatorMeets } from './pages/creator/CreatorMeets';
import { CreatorNotifications } from './pages/creator/CreatorNotifications';
import { CreatorSettings } from './pages/creator/CreatorSettings';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminCreators } from './pages/admin/AdminCreators';
import { AdminFans } from './pages/admin/AdminFans';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminFeaturedCreators } from './pages/admin/AdminFeaturedCreators';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminWithdrawalRequests } from './pages/admin/AdminWithdrawalRequests';
import { AdminRefundsManagement } from './pages/admin/AdminRefundsManagement';
import { AdminRevenueAnalytics } from './pages/admin/AdminRevenueAnalytics';
import { AdminPlatformCommission } from './pages/admin/AdminPlatformCommission';
import { AdminBusinessAnalytics } from './pages/admin/AdminBusinessAnalytics';
import { AdminUserAnalytics } from './pages/admin/AdminUserAnalytics';
import { AdminRevenueReports } from './pages/admin/AdminRevenueReports';
import { AdminEventAnalytics } from './pages/admin/AdminEventAnalytics';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSupportTickets } from './pages/admin/AdminSupportTickets';
import { AdminReportsFlags } from './pages/admin/AdminReportsFlags';
import { AdminDisputes } from './pages/admin/AdminDisputes';
import { AdminSettingsGeneral } from './pages/admin/AdminSettingsGeneral';
import { AdminSettingsPricing } from './pages/admin/AdminSettingsPricing';
import { AdminSettingsEmailTemplates } from './pages/admin/AdminSettingsEmailTemplates';
import { AdminSettingsNotifications } from './pages/admin/AdminSettingsNotifications';
import { AdminSettingsSecurity } from './pages/admin/AdminSettingsSecurity';
import { AdminSystemLogs } from './pages/admin/AdminSystemLogs';
import { AdminSystemBulkActions } from './pages/admin/AdminSystemBulkActions';
import { AdminSystemBackup } from './pages/admin/AdminSystemBackup';
import { AdminProfile } from './pages/admin/AdminProfile';

const Loader = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-[#6C757D]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FFE5D9] border-l-[#FF6B35]" />
      <span>Loading…</span>
    </div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<LandingPage />} />
          <Route path="auth" element={<AuthPage />} />
        </Route>

        <Route path="fan" element={<DashboardShell role="fan" />}>
          <Route index element={<FanDashboard />} />
          <Route path="bids" element={<FanBids />} />
          <Route path="meets" element={<FanMeets />} />
          <Route path="wallet" element={<FanWallet />} />
          <Route path="history" element={<FanHistory />} />
          <Route path="notifications" element={<FanNotifications />} />
          <Route path="settings" element={<FanSettings />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>

        <Route path="creator" element={<DashboardShell role="creator" />}>
          <Route index element={<CreatorOverview />} />
          <Route path="events" element={<CreatorEvents />} />
          <Route path="events/new" element={<CreatorCreateEvent />} />
          <Route path="earnings" element={<CreatorEarnings />} />
          <Route path="withdrawals" element={<CreatorWithdrawals />} />
          <Route path="meets" element={<CreatorMeets />} />
          <Route path="notifications" element={<CreatorNotifications />} />
          <Route path="settings" element={<CreatorSettings />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>

        <Route path="admin" element={<DashboardShell role="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="creators" element={<AdminCreators />} />
          <Route path="fans" element={<AdminFans />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="featured" element={<AdminFeaturedCreators />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="withdrawals" element={<AdminWithdrawalRequests />} />
          <Route path="refunds" element={<AdminRefundsManagement />} />
          <Route path="revenue-analytics" element={<AdminRevenueAnalytics />} />
          <Route path="platform-commission" element={<AdminPlatformCommission />} />
          <Route path="business-analytics" element={<AdminBusinessAnalytics />} />
          <Route path="user-analytics" element={<AdminUserAnalytics />} />
          <Route path="revenue-reports" element={<AdminRevenueReports />} />
          <Route path="event-analytics" element={<AdminEventAnalytics />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="support-tickets" element={<AdminSupportTickets />} />
          <Route path="reports-flags" element={<AdminReportsFlags />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="settings/general" element={<AdminSettingsGeneral />} />
          <Route path="settings/pricing" element={<AdminSettingsPricing />} />
          <Route path="settings/email-templates" element={<AdminSettingsEmailTemplates />} />
          <Route path="settings/notifications" element={<AdminSettingsNotifications />} />
          <Route path="settings/security" element={<AdminSettingsSecurity />} />
          <Route path="system/logs" element={<AdminSystemLogs />} />
          <Route path="system/bulk-actions" element={<AdminSystemBulkActions />} />
          <Route path="system/backup" element={<AdminSystemBackup />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
