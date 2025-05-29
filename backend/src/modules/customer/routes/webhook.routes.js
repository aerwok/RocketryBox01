import express from 'express';
import RazorpayWebhookController from '../controllers/razorpay-webhook.controller.js';

const router = express.Router();

/**
 * Razorpay Webhook Routes
 * These routes handle automatic payment status updates
 */

// Middleware to parse raw body for webhook signature verification
const rawBodyParser = express.raw({ type: '*/*' });

// Main webhook endpoint for Razorpay
// This is the URL you'll configure in Razorpay Dashboard
router.post('/razorpay', 
  rawBodyParser,
  (req, res, next) => {
    // Store raw body for signature verification
    req.rawBody = req.body.toString();
    
    // Convert raw body to JSON for processing
    try {
      req.body = JSON.parse(req.rawBody);
      next();
    } catch (error) {
      console.error('❌ Invalid JSON in webhook body:', error);
      console.error('Raw body:', req.rawBody);
      console.error('Content-Type:', req.headers['content-type']);
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload'
      });
    }
  },
  RazorpayWebhookController.handleWebhook
);

// Webhook statistics endpoint (for monitoring)
router.get('/stats', RazorpayWebhookController.getWebhookStats);

// Health check endpoint for webhook
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router; 