import { Toaster } from "./components/ui/sonner";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MarketingLayout from "./layouts/marketing-layout";
import ScrollToTop from "./components/shared/scroll-to-top";
import "./styles/chart-fix.css";
import AdminRegisterHandler from "./pages/admin/dashboard/teams/handler";
import { NavigationProvider } from "./contexts/navigation-context";
import { ApiService } from "./services/api.service";
import { useNavigation } from "./contexts/navigation-context";
import { useEffect } from "react";

// Marketing Pages
import ContactPage from "./pages/marketing/contact";
import FeaturesPage from "./pages/marketing/features";
import HomePage from "./pages/marketing/home";
import PricingPage from "./pages/marketing/pricing";
import ServicesPage from "./pages/marketing/services";
import SupportPage from "./pages/marketing/support";
import TrackPage from "./pages/marketing/track";
import FaqsPage from "./pages/marketing/faqs";
import PrivacyPage from "./pages/marketing/privacy";
import TermsPage from "./pages/marketing/terms";
import CarrierPartnerPage from "./pages/marketing/partner/carrier";
import TechnologyPartnerPage from "./pages/marketing/partner/technology";
import BecomePartnerPage from "./pages/marketing/partner/join";

// Customer Pages
import CustomerLoginPage from "./pages/customer/auth/login";
import CustomerRegisterPage from "./pages/customer/auth/register";
import CustomerHomePage from "./pages/customer/home";
import CustomerProfile from "./pages/customer/profile";
import CustomerOrdersPage from "./pages/customer/orders";
import CustomerCreateOrderPage from "./pages/customer/create-order";
import CustomerPaymentPage from "./pages/customer/payment";
import CustomerTrackOrderPage from "./pages/customer/track-order";
import CustomerLayout from "./layouts/customer-layout";
import OrderDetails from "./pages/customer/OrderDetails";
import SellerLayout from "./layouts/seller-layout";
import SellerLoginPage from "./pages/seller/auth/login";
import SellerRegisterPage from "./pages/seller/auth/register";
import SellerOTPPage from "./pages/seller/auth/otp";
import SellerCompanyDetailsPage from "./pages/seller/onboarding/company-details";
import SellerBankDetailsPage from "./pages/seller/onboarding/bank-details";
import SellerDashboardPage from "./pages/seller/dashboard/home";
import SellerDashboardLayout from "./layouts/seller-dashboard-layout";
import SellerOrdersPage from "./pages/seller/dashboard/orders";
import SellerNDRPage from "./pages/seller/dashboard/ndr";
import SellerWeightDisputePage from "./pages/seller/dashboard/weight-dispute";
import SellerBillingPage from "./pages/seller/dashboard/billing";
import SellerToolsPage from "./pages/seller/dashboard/tools";
import SellerWarehousePage from "./pages/seller/dashboard/warehouse";
import SellerServiceCheckPage from "./pages/seller/dashboard/service-check";
import SellerProductsPage from "./pages/seller/dashboard/products";
import SellerRateCalculatorPage from "./pages/seller/dashboard/rate-calculator";
import SellerCODPage from "./pages/seller/dashboard/cod";
import SellerProfilePage from "./pages/seller/dashboard/profile";
import SellerSettingsPage from "./pages/seller/dashboard/settings";
import SellerDisputePage from "./pages/seller/dashboard/disputes";
import SellerNewOrderPage from "./pages/seller/dashboard/new-order";
import SellerReceivedPage from "./pages/seller/dashboard/received";
import SellerSupportPage from "./pages/seller/dashboard/support";
import SellerShipmentsPage from "./pages/seller/dashboard/shipments";
import SellerBulkOrdersPage from './pages/seller/dashboard/bulk-orders';
import SellerOrderDetailsPage from "./pages/seller/dashboard/orders/[id]";
import SellerNDRDetailsPage from "./pages/seller/dashboard/ndr/[id]";
import SellerReportsPage from "./pages/seller/dashboard/reports";
import EditOrderPage from "./pages/seller/dashboard/orders/edit/[id]";
import AdminEditOrderPage from "./pages/admin/dashboard/orders/edit/[id]";

// Admin Pages
import AdminPartnersPage from "./pages/admin/dashboard/partners";
import AdminDashboardLayout from "./layouts/admin-dashboard-layout";
import AdminDashboardPage from "./pages/admin/dashboard";
import AdminLoginPage from "./pages/admin/auth/login";
import AdminRegisterPage from "./pages/admin/auth/register";
import AdminReportsPage from "./pages/admin/dashboard/reports";
import AdminUsersPage from "./pages/admin/dashboard/users";
import AdminOrdersPage from "./pages/admin/dashboard/orders";
import AdminShipmentsPage from "./pages/admin/dashboard/shipments";
import AdminTicketsPage from "./pages/admin/dashboard/tickets";
import AdminNDRPage from "./pages/admin/dashboard/ndr";
import AdminBillingPage from "./pages/admin/dashboard/billing";
import AdminTeamsPage from "./pages/admin/dashboard/teams";
import AdminEscalationLayout from "./layouts/admin-escalation-layout";
import AdminEscalationSearchPage from "./pages/admin/dashboard/escalation/search";
import AdminEscalationStatisticsPage from "./pages/admin/dashboard/escalation/statistics";
import AdminEscalationPickupsPage from "./pages/admin/dashboard/escalation/pickups";
import AdminEscalationShipmentsPage from "./pages/admin/dashboard/escalation/shipments";
import AdminEscalationBillingPage from "./pages/admin/dashboard/escalation/billing";
import AdminEscalationWeightIssuesPage from "./pages/admin/dashboard/escalation/weight-issues";
import AdminEscalationTechIssuesPage from "./pages/admin/dashboard/escalation/tech-issues";
import AdminLayout from "./layouts/admin-layout";
import AdminCustomerDashboardPage from "./pages/admin/dashboard/customer";
import AdminSettingsPage from "./pages/admin/dashboard/settings";
import NotificationSettings from "./pages/admin/dashboard/settings/notification";
import PolicySettings from "./pages/admin/dashboard/settings/policy";
import MaintenanceSettings from "./pages/admin/dashboard/settings/maintenance";
import SystemSettings from "./pages/admin/dashboard/settings/system";
import PolicyEditPage from "./pages/admin/dashboard/settings/policy/[slug]/edit";
import AdminOrderDetailsPage from "./pages/admin/dashboard/orders/[id]";
import AdminShipmentDetailsPage from "./pages/admin/dashboard/shipments/[id]";
import AdminNDRDetailsPage from "./pages/admin/dashboard/ndr/[id]";
import SellerDisputeDetailsPage from "./pages/seller/dashboard/disputes/[id]";
import AdminUserProfilePage from "./pages/admin/dashboard/users/[id]";
import AdminTeamProfilePage from "./pages/admin/dashboard/teams/[id]";
import SellerShipmentDetailsPage from "./pages/seller/dashboard/shipments/[id]";
import MyProfilePage from "./pages/admin/profile";
import ManageStorePage from "./pages/seller/dashboard/settings/manage-store";
import CouriersSettingsPage from "./pages/seller/dashboard/settings/couriers";
import LabelSettingsPage from "./pages/seller/dashboard/settings/labels";
import ManageUsersPage from "./pages/seller/dashboard/settings/users";
import WhatsAppSettingsPage from "./pages/seller/dashboard/settings/whatsapp";
import ApiSettingsPage from "./pages/seller/dashboard/settings/api";
import PolicyCreatePage from "./pages/admin/dashboard/settings/policy/create";

const AppRoutes = () => {
  const { setNavigate } = useNavigation();
  const apiService = new ApiService();

  useEffect(() => {
    setNavigate((navigate) => {
      apiService.setNavigate(navigate);
    });
  }, [setNavigate]);

  return (
    <Routes>
      {/* Marketing Routes */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        {/* Partner Marketing Pages */}
        <Route path="/partner/carrier" element={<CarrierPartnerPage />} />
        <Route path="/partner/technology" element={<TechnologyPartnerPage />} />
        <Route path="/partner/join" element={<BecomePartnerPage />} />
      </Route>

      {/* Customer Routes */}
      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<Navigate to="/customer/home" replace />} />
        <Route path="home" element={<CustomerHomePage />} />
        <Route path="auth">
          <Route path="login" element={<CustomerLoginPage />} />
          <Route path="register" element={<CustomerRegisterPage />} />
        </Route>
        <Route path="login" element={<Navigate to="/customer/auth/login" replace />} />
        <Route path="register" element={<Navigate to="/customer/auth/register" replace />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
        <Route path="orders/:orderId" element={<OrderDetails />} />
        <Route path="create-order" element={<CustomerCreateOrderPage />} />
        <Route path="payment" element={<CustomerPaymentPage />} />
        <Route path="track-order" element={<CustomerTrackOrderPage />} />
      </Route>

      {/* Seller Auth Routes */}
      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<Navigate to="/seller/login" replace />} />
        <Route path="login" element={<SellerLoginPage />} />
        <Route path="register" element={<SellerRegisterPage />} />
        <Route path="otp" element={<SellerOTPPage />} />
        <Route path="onboarding">
          <Route path="company-details" element={<SellerCompanyDetailsPage />} />
          <Route path="bank-details" element={<SellerBankDetailsPage />} />
        </Route>
      </Route>

      {/* Seller Dashboard Routes */}
      <Route path="/seller/dashboard" element={<SellerDashboardLayout />}>
        <Route index element={<SellerDashboardPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="orders/edit/:id" element={<EditOrderPage />} />
        <Route path="orders/:id" element={<SellerOrderDetailsPage />} />
        <Route path="shipments" element={<SellerShipmentsPage />} />
        <Route path="shipments/:id" element={<SellerShipmentDetailsPage />} />
        <Route path="received" element={<SellerReceivedPage />} />
        <Route path="disputes" element={<SellerDisputePage />} />
        <Route path="disputes/:id" element={<SellerDisputeDetailsPage />} />
        <Route path="ndr" element={<SellerNDRPage />} />
        <Route path="ndr/:id" element={<SellerNDRDetailsPage />} />
        <Route path="weight-dispute" element={<SellerWeightDisputePage />} />
        <Route path="billing" element={<SellerBillingPage />} />
        <Route path="tools" element={<SellerToolsPage />} />
        <Route path="warehouse" element={<SellerWarehousePage />} />
        <Route path="service-check" element={<SellerServiceCheckPage />} />
        <Route path="products" element={<SellerProductsPage />} />
        <Route path="rate-calculator" element={<SellerRateCalculatorPage />} />
        <Route path="cod" element={<SellerCODPage />} />
        <Route path="profile" element={<SellerProfilePage />} />
        <Route path="new-order" element={<SellerNewOrderPage />} />
        <Route path="settings" element={<SellerSettingsPage />} />
        <Route path="settings/manage-store" element={<ManageStorePage />} />
        <Route path="settings/couriers" element={<CouriersSettingsPage />} />
        <Route path="settings/labels" element={<LabelSettingsPage />} />
        <Route path="settings/users" element={<ManageUsersPage />} />
        <Route path="settings/whatsapp" element={<WhatsAppSettingsPage />} />
        <Route path="settings/api" element={<ApiSettingsPage />} />
        <Route path="support" element={<SellerSupportPage />} />
        <Route path="bulk-orders" element={<SellerBulkOrdersPage />} />
        <Route path="reports" element={<SellerReportsPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/login" replace />} />
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="register" element={<AdminRegisterPage />} />
        <Route path="auth/register" element={<AdminRegisterPage />} />
        <Route path="profile" element={<MyProfilePage />} />
        <Route path="dashboard" element={<AdminDashboardLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="customer" element={<AdminCustomerDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserProfilePage />} />
          <Route path="teams" element={<AdminTeamsPage />} />
          <Route path="teams/:id" element={<AdminTeamProfilePage />} />
          <Route path="teams/handler" element={<AdminRegisterHandler />} />
          <Route path="partners" element={<AdminPartnersPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/edit/:id" element={<AdminEditOrderPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
          <Route path="shipments" element={<AdminShipmentsPage />} />
          <Route path="shipments/:id" element={<AdminShipmentDetailsPage />} />
          <Route path="tickets" element={<AdminTicketsPage />} />
          <Route path="ndr" element={<AdminNDRPage />} />
          <Route path="ndr/:id" element={<AdminNDRDetailsPage />} />
          <Route path="billing" element={<AdminBillingPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="escalation" element={<AdminEscalationLayout />}>
            <Route path="search" element={<AdminEscalationSearchPage />} />
            <Route path="statistics" element={<AdminEscalationStatisticsPage />} />
            <Route path="pickups" element={<AdminEscalationPickupsPage />} />
            <Route path="shipments" element={<AdminEscalationShipmentsPage />} />
            <Route path="billing" element={<AdminEscalationBillingPage />} />
            <Route path="weight-issues" element={<AdminEscalationWeightIssuesPage />} />
            <Route path="tech-issues" element={<AdminEscalationTechIssuesPage />} />
          </Route>
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="settings/system" element={<SystemSettings />} />
          <Route path="settings/notification" element={<NotificationSettings />} />
          <Route path="settings/policy" element={<PolicySettings />} />
          <Route path="settings/policy/:slug/edit" element={<PolicyEditPage />} />
          <Route path="settings/policy/create" element={<PolicyCreatePage />} />
          <Route path="settings/maintenance" element={<MaintenanceSettings />} />
        </Route>
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <ScrollToTop />
        <Toaster richColors theme="light" position="top-center" />
        <AppRoutes />
      </NavigationProvider>
    </BrowserRouter>
  );
};

export default App;
