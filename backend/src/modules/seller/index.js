import express from 'express';
import agreementRoutes from './routes/agreement.routes.js';
import bulkOrdersRoutes from './routes/bulkOrders.routes.js';
import codRemittanceRoutes from './routes/codRemittance.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import ledgerRoutes from './routes/ledger.routes.js';
import ndrRoutes from './routes/ndr.routes.js';
import orderRoutes from './routes/order.routes.js';
import productRoutes from './routes/product.routes.js';
import rateCardRoutes from './routes/ratecard.routes.js';
import sellerRoutes from './routes/seller.routes.js';
import serviceCheckRoutes from './routes/serviceCheck.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import shipmentRoutes from './routes/shipment.routes.js';
import storeRoutes from './routes/store.routes.js';
import supportRoutes from './routes/support.routes.js';
import teamUserRoutes from './routes/teamUser.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import weightDisputeRoutes from './routes/weightDispute.routes.js';

// Import document requirement middleware
import {
  progressiveDocumentAccess,
  requireBasicProfile,
  requireDocumentUpload
} from '../../middleware/documentVerification.js';

const router = express.Router();

// Auth and basic seller routes (always accessible for profile/document management)
router.use('/', sellerRoutes);

// Support (always accessible)
router.use('/support', supportRoutes);

// Agreements (always accessible)
router.use('/agreements', agreementRoutes);

// ==============================================================================
// PROGRESSIVE ACCESS ROUTES (Require basic profile completion)
// ==============================================================================

// Dashboard - Require basic profile completion (50% document completion)
router.use('/dashboard', requireBasicProfile, progressiveDocumentAccess(50), dashboardRoutes);

// Settings - Require basic profile completion
router.use('/settings', requireBasicProfile, settingsRoutes);

// Warehouse and service checks - Basic tools, require profile completion
router.use('/warehouse', requireBasicProfile, warehouseRoutes);
router.use('/service-check', requireBasicProfile, serviceCheckRoutes);

// ==============================================================================
// CRITICAL BUSINESS OPERATIONS (Require 100% document upload)
// ==============================================================================

// Order management - REQUIRES ALL DOCUMENTS
router.use('/orders', requireDocumentUpload, orderRoutes);

// Shipment management - REQUIRES ALL DOCUMENTS
router.use('/shipments', requireDocumentUpload, shipmentRoutes);

// Bulk Orders - REQUIRES ALL DOCUMENTS
router.use('/bulk-orders', requireDocumentUpload, bulkOrdersRoutes);

// Financial management - REQUIRES ALL DOCUMENTS
router.use('/wallet', requireDocumentUpload, walletRoutes);
router.use('/invoices', requireDocumentUpload, invoiceRoutes);
router.use('/ledger', requireDocumentUpload, ledgerRoutes);
router.use('/cod-remittance', requireDocumentUpload, codRemittanceRoutes);

// Rate Card management - REQUIRES ALL DOCUMENTS
router.use('/rate-card', requireDocumentUpload, rateCardRoutes);

// Business operations - REQUIRES ALL DOCUMENTS
router.use('/ndr', requireDocumentUpload, ndrRoutes);
router.use('/weight-disputes', requireDocumentUpload, weightDisputeRoutes);

// Store and product management - REQUIRES ALL DOCUMENTS
router.use('/stores', requireDocumentUpload, storeRoutes);
router.use('/products', requireDocumentUpload, productRoutes);

// Team Management - REQUIRES ALL DOCUMENTS
router.use('/team', requireDocumentUpload, teamUserRoutes);

export default router;
