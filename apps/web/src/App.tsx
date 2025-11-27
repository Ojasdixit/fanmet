import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppShell } from './layouts/AppShell';
import { DashboardShell } from './layouts/DashboardShell';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/auth/AuthPage';
import { AdminAuthPage } from './pages/auth/AdminAuthPage';
import { BrowseEventsPage } from './pages/BrowseEventsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ForCreatorsPage } from './pages/ForCreatorsPage';
import { FanDashboard } from './pages/fan/FanDashboard';
import { FanBids } from './pages/fan/FanBids';
import { FanMeets } from './pages/fan/FanMeets';
import { FanWallet } from './pages/fan/FanWallet';
import { FanFollowing } from './pages/fan/FanFollowing';
import { FanHistory } from './pages/fan/FanHistory';
import { FanNotifications } from './pages/fan/FanNotifications';
import { FanSettings } from './pages/fan/FanSettings';
import { FanMessages } from './pages/fan/FanMessages';
import { FanSupport } from './pages/fan/FanSupport';
import { CreatorOverview } from './pages/creator/CreatorOverview';
import { CreatorEvents } from './pages/creator/CreatorEvents';
import { CreatorCreateEvent } from './pages/creator/CreatorCreateEvent';
import { CreatorProfileSetup } from './pages/creator/CreatorProfileSetup';
import { CreatorEarnings } from './pages/creator/CreatorEarnings';
import { CreatorWithdrawals } from './pages/creator/CreatorWithdrawals';
import { CreatorMeets } from './pages/creator/CreatorMeets';
import { CreatorFollowers } from './pages/creator/CreatorFollowers';
import { CreatorNotifications } from './pages/creator/CreatorNotifications';
import { CreatorSettings } from './pages/creator/CreatorSettings';
import { CreatorMessages } from './pages/creator/CreatorMessages';
import { CreatorSupport } from './pages/creator/CreatorSupport';
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
import { AdminMeetsDebug } from './pages/admin/AdminMeetsDebug';
import { InfluencerPage } from './pages/influencer/InfluencerPage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { AuthProvider } from './contexts/AuthContext';
import { EventProvider } from './contexts/EventContext';
import { CreatorProfileProvider } from './contexts/CreatorProfileContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ProtectedRoute } from './components/ProtectedRoute';

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
      <AuthProvider>
        <EventProvider>
          <CreatorProfileProvider>
            <NotificationsProvider>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<LandingPage />} />
                  <Route path="auth" element={<AuthPage />} />
                  <Route path="fanmeet/admin/superadmin" element={<AdminAuthPage />} />
                  <Route path="browse-events" element={<BrowseEventsPage />} />
                  <Route path="how-it-works" element={<HowItWorksPage />} />
                  <Route path="for-creators" element={<ForCreatorsPage />} />
                  <Route path="events/:eventId" element={<EventDetailPage />} />
                  <Route path=":username" element={<InfluencerPage />} />
                </Route>

                <Route
                  path="fan"
                  element={
                    <ProtectedRoute allowedRoles={['fan']}>
                      <DashboardShell role="fan" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<FanDashboard />} />
                  <Route path="bids" element={<FanBids />} />
                  <Route path="meets" element={<FanMeets />} />
                  <Route path="wallet" element={<FanWallet />} />
                  <Route path="following" element={<FanFollowing />} />
                  <Route path="history" element={<FanHistory />} />
                  <Route path="messages" element={<FanMessages />} />
                  <Route path="notifications" element={<FanNotifications />} />
                  <Route path="settings" element={<FanSettings />} />
                  <Route path="support" element={<FanSupport />} />
                  <Route path="*" element={<Navigate to="." replace />} />
                </Route>

                <Route
                  path="creator"
                  element={
                    <ProtectedRoute allowedRoles={['creator']}>
                      <DashboardShell role="creator" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<CreatorOverview />} />
                  <Route path="events" element={<CreatorEvents />} />
                  <Route path="events/new" element={<CreatorCreateEvent />} />
                  <Route path="profile-setup" element={<CreatorProfileSetup />} />
                  <Route path="earnings" element={<CreatorEarnings />} />
                  <Route path="withdrawals" element={<CreatorWithdrawals />} />
                  <Route path="meets" element={<CreatorMeets />} />
                  <Route path="followers" element={<CreatorFollowers />} />
                  <Route path="messages" element={<CreatorMessages />} />
                  <Route path="notifications" element={<CreatorNotifications />} />
                  <Route path="settings" element={<CreatorSettings />} />
                  <Route path="support" element={<CreatorSupport />} />
                  <Route path="*" element={<Navigate to="." replace />} />
                </Route>

                <Route
                  path="admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DashboardShell role="admin" />
                    </ProtectedRoute>
                  }
                >
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
                  <Route path="debug/meets" element={<AdminMeetsDebug />} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route path="*" element={<Navigate to="." replace />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationsProvider>
          </CreatorProfileProvider>
        </EventProvider>
      </AuthProvider>
    </Suspense>
  );
}
