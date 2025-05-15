import AdminShipment from '../models/shipment.model.js';
import ShippingPartner from '../models/shippingPartner.model.js';
import SellerShipment from '../../seller/models/shipment.model.js';
import SellerOrder from '../../seller/models/order.model.js';
import Seller from '../../seller/models/seller.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import mongoose from 'mongoose';
import { trackShipment } from '../../../utils/shipping.js';
import csv from 'fast-csv';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { io } from '../../../server.js';
import { logger } from '../../../utils/logger.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS } from '../../../utils/sms.js';

/**
 * Get all shipments with filtering, sorting, and pagination
 * @route GET /api/v2/admin/shipments
 * @access Private (Admin only)
 */
export const getShipments = async (req, res, next) => {
  try {
    const {
      awb,
      courier,
      status,
      startDate,
      endDate,
      sellerId,
      customerPhone,
      customerEmail,
      sort = '-createdAt',
      limit = 20,
      page = 1
    } = req.query;

    // Build filter object
    const filter = {};
    if (awb) filter.awb = new RegExp(awb, 'i');
    if (courier) filter.courier = new RegExp(courier, 'i');
    if (status) filter.status = status;
    if (sellerId) filter['seller.id'] = sellerId;
    if (customerPhone) filter['customer.phone'] = new RegExp(customerPhone, 'i');
    if (customerEmail) filter['customer.email'] = new RegExp(customerEmail, 'i');
    
    // Date filters
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateObj;
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [shipments, total] = await Promise.all([
      AdminShipment.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AdminShipment.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: shipments.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: shipments
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * Get shipment by ID
 * @route GET /api/v2/admin/shipments/:id
 * @access Private (Admin only)
 */
export const getShipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check for valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid shipment ID', 400));
    }

    const shipment = await AdminShipment.findById(id);

    if (!shipment) {
      return next(new AppError('Shipment not found', 404));
    }

    res.status(200).json({
      success: true,
      data: shipment
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * Sync shipment data from seller shipments
 * @route POST /api/v2/admin/shipments/sync
 * @access Private (Admin only)
 */
export const syncShipments = async (req, res, next) => {
  try {
    const { fromDate, sellerId } = req.body;
    
    // Prepare filter for seller shipments
    const filter = {};
    if (fromDate) {
      filter.createdAt = { $gte: new Date(fromDate) };
    } else {
      // Default to last 24 hours if no date provided
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      filter.createdAt = { $gte: oneDayAgo };
    }
    
    if (sellerId) {
      filter.seller = sellerId;
    }
    
    // Get all seller shipments matching the filter
    const sellerShipments = await SellerShipment.find(filter)
      .populate({
        path: 'seller',
        select: 'name email phone businessName'
      })
      .populate({
        path: 'orderId',
        select: 'orderNumber customer shippingAddress paymentMethod totalAmount items'
      });
    
    if (sellerShipments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new shipments found to sync',
        syncedCount: 0
      });
    }
    
    let syncedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // Process each seller shipment
    for (const sellerShipment of sellerShipments) {
      try {
        // Check if shipment is already synced
        const existingShipment = await AdminShipment.findOne({
          originalShipment: sellerShipment._id
        });
        
        if (existingShipment) {
          // Update existing shipment
          existingShipment.status = sellerShipment.status;
          existingShipment.trackingHistory = sellerShipment.trackingHistory;
          existingShipment.deliveryDate = sellerShipment.deliveryDate;
          existingShipment.updatedAt = new Date();
          existingShipment.lastSyncAt = new Date();
          existingShipment.lastSyncedBy = req.user.id;
          
          await existingShipment.save();
          skippedCount++;
        } else {
          // Find partner ID if available
          let partnerId = null;
          if (sellerShipment.courier) {
            const partner = await ShippingPartner.findOne({
              name: { $regex: new RegExp(sellerShipment.courier, 'i') }
            });
            if (partner) {
              partnerId = partner._id;
            }
          }
          
          // Create new admin shipment
          const adminShipment = new AdminShipment({
            originalShipment: sellerShipment._id,
            order: sellerShipment.orderId._id,
            orderModel: 'SellerOrder',
            seller: {
              id: sellerShipment.seller._id,
              name: sellerShipment.seller.name,
              email: sellerShipment.seller.email,
              phone: sellerShipment.seller.phone,
              businessName: sellerShipment.seller.businessName
            },
            customer: sellerShipment.orderId.customer,
            awb: sellerShipment.awb,
            courier: sellerShipment.courier,
            partnerId: partnerId,
            status: sellerShipment.status,
            pickupDate: sellerShipment.pickupDate,
            deliveryDate: sellerShipment.deliveryDate,
            weight: sellerShipment.weight,
            dimensions: sellerShipment.dimensions,
            shippingCharge: sellerShipment.shippingCharge,
            codAmount: sellerShipment.orderId.paymentMethod === 'COD' ? sellerShipment.orderId.totalAmount : 0,
            isCod: sellerShipment.orderId.paymentMethod === 'COD',
            deliveryAddress: sellerShipment.orderId.shippingAddress,
            trackingHistory: sellerShipment.trackingHistory,
            trackingUrl: sellerShipment.trackingUrl,
            channel: sellerShipment.channel,
            lastSyncAt: new Date(),
            lastSyncedBy: req.user.id
          });
          
          await adminShipment.save();
          syncedCount++;
        }
      } catch (error) {
        errors.push({
          shipmentId: sellerShipment._id,
          awb: sellerShipment.awb,
          error: error.message
        });
        logger.error(`Error syncing shipment ${sellerShipment.awb}: ${error.message}`);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Synced ${syncedCount} shipments, updated ${skippedCount} existing shipments`,
      syncedCount,
      skippedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
}; 