import express from 'express';
import sellerRoutes from './routes/seller.routes.js';
import orderRoutes from './routes/order.routes.js';
import shipmentRoutes from './routes/shipment.routes.js';
import ndrRoutes from './routes/ndr.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import ledgerRoutes from './routes/ledger.routes.js';
import weightDisputeRoutes from './routes/weightDispute.routes.js';
import codRemittanceRoutes from './routes/codRemittance.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import serviceCheckRoutes from './routes/serviceCheck.routes.js';
import supportRoutes from './routes/support.routes.js';
import productRoutes from './routes/product.routes.js';
import storeRoutes from './routes/store.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import rateCardRoutes from './routes/ratecard.routes.js';
import teamUserRoutes from './routes/teamUser.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import bulkOrdersRoutes from './routes/bulkOrders.routes.js';

const router = express.Router();

// Auth and basic seller routes
router.use('/', sellerRoutes);

// Order management
router.use('/orders', orderRoutes);

// Shipment management
router.use('/shipments', shipmentRoutes);

// NDR management
router.use('/ndr', ndrRoutes);

// Financial management
router.use('/wallet', walletRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/weight-disputes', weightDisputeRoutes);
router.use('/cod-remittance', codRemittanceRoutes);

// Tools and utilities
router.use('/warehouse', warehouseRoutes);
router.use('/service-check', serviceCheckRoutes);

// Support
router.use('/support', supportRoutes);

// Product management
router.use('/products', productRoutes);

// Store management
router.use('/stores', storeRoutes);

// Settings
router.use('/settings', settingsRoutes);

// Rate Card
router.use('/rate-card', rateCardRoutes);

// Team Management
router.use('/team', teamUserRoutes);

// Dashboard
router.use('/dashboard', dashboardRoutes);

// Bulk Orders
router.use('/bulk-orders', bulkOrdersRoutes);

export default router; 