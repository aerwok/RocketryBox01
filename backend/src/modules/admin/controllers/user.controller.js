import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../utils/logger.js';
import Seller from '../../seller/models/seller.model.js';
import Customer from '../../customer/models/customer.model.js';
import Order from '../../order/models/order.model.js';
import KYC from '../../seller/models/kyc.model.js';
import Agreement from '../../seller/models/agreement.model.js';
import RateCard from '../../seller/models/ratecard.model.js';

/**
 * Get all sellers with pagination and filters
 * @route GET /api/v1/admin/users/sellers
 * @access Private (Admin only)
 */
export const getAllSellers = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status,
            search,
            kycStatus
        } = req.query;

        // Build query
        const query = {};
        
        // Add status filter if provided
        if (status) {
            query.status = status;
        }

        // Add search filter if provided
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { 'businessDetails.name': { $regex: search, $options: 'i' } },
                { 'businessDetails.gstin': { $regex: search, $options: 'i' } }
            ];
        }

        // Add KYC status filter if provided (requires aggregation)
        let sellers;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        
        if (kycStatus) {
            // Use aggregation for KYC filtering
            sellers = await Seller.aggregate([
                {
                    $lookup: {
                        from: 'kycs',
                        localField: '_id',
                        foreignField: 'seller',
                        as: 'kycDetails'
                    }
                },
                {
                    $match: {
                        ...query,
                        'kycDetails.status': kycStatus
                    }
                },
                {
                    $sort: { [sortBy]: sortDirection }
                },
                {
                    $skip: skip
                },
                {
                    $limit: parseInt(limit)
                }
            ]);
        } else {
            // Use normal find for non-KYC filtering
            sellers = await Seller.find(query)
                .sort({ [sortBy]: sortDirection })
                .skip(skip)
                .limit(parseInt(limit));
        }

        // Get total count for pagination
        const totalSellers = await Seller.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                sellers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalSellers / parseInt(limit)),
                    totalResults: totalSellers
                }
            }
        });
    } catch (error) {
        logger.error(`Error in getAllSellers: ${error.message}`);
        next(new AppError('Failed to fetch sellers', 500));
    }
};

/**
 * Get seller details by ID including KYC, agreements and order stats
 * @route GET /api/v1/admin/users/sellers/:id
 * @access Private (Admin only)
 */
export const getSellerDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get seller details
        const seller = await Seller.findById(id);
        
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }

        // Get KYC details
        const kyc = await KYC.findOne({ seller: id });

        // Get agreements
        const agreements = await Agreement.find({ seller: id });

        // Get rate cards
        const rateCards = await RateCard.find({ seller: id });

        // Get order stats
        const orderStats = await Order.aggregate([
            {
                $match: { seller: seller._id }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Calculate total orders and revenue
        const totalOrders = await Order.countDocuments({ seller: id });
        const totalRevenue = await Order.aggregate([
            {
                $match: { seller: seller._id }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                seller,
                kycDetails: kyc || null,
                agreements,
                rateCards,
                stats: {
                    orderBreakdown: orderStats,
                    totalOrders,
                    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
                }
            }
        });
    } catch (error) {
        logger.error(`Error in getSellerDetails: ${error.message}`);
        next(new AppError('Failed to fetch seller details', 500));
    }
};

/**
 * Update seller status
 * @route PATCH /api/v1/admin/users/sellers/:id/status
 * @access Private (Admin only)
 */
export const updateSellerStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        // Find and update seller
        const seller = await Seller.findById(id);
        
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }

        // Update status
        seller.status = status;
        
        // Add status change to history
        seller.statusHistory = seller.statusHistory || [];
        seller.statusHistory.push({
            status,
            reason,
            updatedBy: req.user.id,
            timestamp: new Date()
        });

        await seller.save();

        // Log the status update
        logger.info(`Admin ${req.user.id} updated seller ${id} status to ${status}`);

        res.status(200).json({
            success: true,
            data: {
                seller
            }
        });
    } catch (error) {
        logger.error(`Error in updateSellerStatus: ${error.message}`);
        next(new AppError('Failed to update seller status', 500));
    }
};

/**
 * Update seller KYC status
 * @route PATCH /api/v1/admin/users/sellers/:id/kyc
 * @access Private (Admin only)
 */
export const updateSellerKYC = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body;

        // Find seller
        const seller = await Seller.findById(id);
        
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }

        // Find and update KYC
        const kyc = await KYC.findOne({ seller: id });
        
        if (!kyc) {
            return next(new AppError('KYC records not found for this seller', 404));
        }

        // Update KYC status
        kyc.status = status;
        
        // Add verification details
        kyc.verificationDetails = kyc.verificationDetails || [];
        kyc.verificationDetails.push({
            status,
            comments,
            verifiedBy: req.user.id,
            timestamp: new Date()
        });

        await kyc.save();

        // If KYC is approved or rejected, update seller status accordingly
        if (status === 'approved') {
            seller.kycVerified = true;
            await seller.save();
        } else if (status === 'rejected') {
            seller.kycVerified = false;
            await seller.save();
        }

        // Log the KYC update
        logger.info(`Admin ${req.user.id} updated seller ${id} KYC status to ${status}`);

        res.status(200).json({
            success: true,
            data: {
                kyc
            }
        });
    } catch (error) {
        logger.error(`Error in updateSellerKYC: ${error.message}`);
        next(new AppError('Failed to update seller KYC status', 500));
    }
};

/**
 * Create a new agreement for seller
 * @route POST /api/v1/admin/users/sellers/:id/agreements
 * @access Private (Admin only)
 */
export const createSellerAgreement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, validFrom, validTo, isActive } = req.body;

        // Find seller
        const seller = await Seller.findById(id);
        
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }

        // Create new agreement
        const agreement = new Agreement({
            seller: id,
            title,
            content,
            validFrom,
            validTo,
            isActive,
            createdBy: req.user.id
        });

        await agreement.save();

        // Log the agreement creation
        logger.info(`Admin ${req.user.id} created new agreement for seller ${id}`);

        res.status(201).json({
            success: true,
            data: {
                agreement
            }
        });
    } catch (error) {
        logger.error(`Error in createSellerAgreement: ${error.message}`);
        next(new AppError('Failed to create seller agreement', 500));
    }
};

/**
 * Create or update rate card for seller
 * @route POST /api/v1/admin/users/sellers/:id/ratecards
 * @access Private (Admin only)
 */
export const manageSellerRateCard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, rates, validFrom, validTo, isActive } = req.body;

        // Find seller
        const seller = await Seller.findById(id);
        
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }

        // Create or update rate card
        let rateCard = await RateCard.findOne({ 
            seller: id,
            title: title
        });

        if (rateCard) {
            // Update existing rate card
            rateCard.rates = rates;
            rateCard.validFrom = validFrom;
            rateCard.validTo = validTo;
            rateCard.isActive = isActive;
            rateCard.updatedBy = req.user.id;
        } else {
            // Create new rate card
            rateCard = new RateCard({
                seller: id,
                title,
                rates,
                validFrom,
                validTo,
                isActive,
                createdBy: req.user.id
            });
        }

        await rateCard.save();

        // Log the rate card operation
        logger.info(`Admin ${req.user.id} ${rateCard.isNew ? 'created' : 'updated'} rate card for seller ${id}`);

        res.status(rateCard.isNew ? 201 : 200).json({
            success: true,
            data: {
                rateCard
            }
        });
    } catch (error) {
        logger.error(`Error in manageSellerRateCard: ${error.message}`);
        next(new AppError('Failed to manage seller rate card', 500));
    }
};

/**
 * Get all customers with pagination and filters
 * @route GET /api/v1/admin/users/customers
 * @access Private (Admin only)
 */
export const getAllCustomers = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status,
            search
        } = req.query;

        // Build query
        const query = {};
        
        // Add status filter if provided
        if (status) {
            query.status = status;
        }

        // Add search filter if provided
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        
        const customers = await Customer.find(query)
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalCustomers = await Customer.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                customers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalCustomers / parseInt(limit)),
                    totalResults: totalCustomers
                }
            }
        });
    } catch (error) {
        logger.error(`Error in getAllCustomers: ${error.message}`);
        next(new AppError('Failed to fetch customers', 500));
    }
};

/**
 * Get customer details by ID including order history
 * @route GET /api/v1/admin/users/customers/:id
 * @access Private (Admin only)
 */
export const getCustomerDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get customer details
        const customer = await Customer.findById(id);
        
        if (!customer) {
            return next(new AppError('Customer not found', 404));
        }

        // Get order history
        const orders = await Order.find({ customer: id })
            .sort({ createdAt: -1 })
            .limit(10);

        // Get order stats
        const orderStats = await Order.aggregate([
            {
                $match: { customer: customer._id }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Calculate total orders and spending
        const totalOrders = await Order.countDocuments({ customer: id });
        const totalSpending = await Order.aggregate([
            {
                $match: { customer: customer._id }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                customer,
                orders,
                stats: {
                    orderBreakdown: orderStats,
                    totalOrders,
                    totalSpending: totalSpending.length > 0 ? totalSpending[0].total : 0
                }
            }
        });
    } catch (error) {
        logger.error(`Error in getCustomerDetails: ${error.message}`);
        next(new AppError('Failed to fetch customer details', 500));
    }
};

/**
 * Update customer status
 * @route PATCH /api/v1/admin/users/customers/:id/status
 * @access Private (Admin only)
 */
export const updateCustomerStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        // Find and update customer
        const customer = await Customer.findById(id);
        
        if (!customer) {
            return next(new AppError('Customer not found', 404));
        }

        // Update status
        customer.status = status;
        
        // Add status change to history if the field exists
        if (customer.statusHistory) {
            customer.statusHistory.push({
                status,
                reason,
                updatedBy: req.user.id,
                timestamp: new Date()
            });
        }

        await customer.save();

        // Log the status update
        logger.info(`Admin ${req.user.id} updated customer ${id} status to ${status}`);

        res.status(200).json({
            success: true,
            data: {
                customer
            }
        });
    } catch (error) {
        logger.error(`Error in updateCustomerStatus: ${error.message}`);
        next(new AppError('Failed to update customer status', 500));
    }
}; 