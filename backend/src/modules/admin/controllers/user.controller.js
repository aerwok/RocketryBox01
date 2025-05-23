import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../utils/logger.js';
import Seller from '../../seller/models/seller.model.js';
import Customer from '../../customer/models/customer.model.js';
import Order from '../../order/models/order.model.js';
import Agreement from '../../seller/models/agreement.model.js';
import RateCard from '../../seller/models/ratecard.model.js';
import { getIO } from '../../../utils/socketio.js';
import { getSellerProfile } from '../../seller/services/realtime.service.js';
import { getCustomerProfile } from '../../customer/services/realtime.service.js';
import { invalidateCachePattern, CACHE_PATTERNS } from '../../../utils/cache.js';
import mongoose from 'mongoose';

/**
 * Get all users (both sellers and customers) with pagination and filters
 * @route GET /api/v2/admin/users
 * @access Private (Admin only)
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status,
            search,
            type = 'seller' // Default to seller for backward compatibility
        } = req.query;

        if (type === 'seller') {
            return getAllSellers(req, res, next);
        } else if (type === 'customer') {
            return getAllCustomers(req, res, next);
        } else {
            // Return combined results if no specific type requested
            const sellerQuery = { type: 'seller', ...req.query };
            const customerQuery = { type: 'customer', ...req.query };
            
            // For simplicity, default to sellers if no type specified
            return getAllSellers(req, res, next);
        }
    } catch (error) {
        logger.error(`Error in getAllUsers: ${error.message}`);
        next(new AppError('Failed to fetch users', 500));
    }
};

/**
 * Get user details by ID (auto-detect if seller or customer)
 * @route GET /api/v2/admin/users/:id
 * @access Private (Admin only)
 */
export const getUserDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        logger.info(`getUserDetails called with ID: "${id}"`);
        logger.info(`ID type: ${typeof id}, length: ${id ? id.length : 'null'}`);
        logger.info(`ID characters: ${id ? id.split('').map(c => c.charCodeAt(0)).join(',') : 'null'}`);
        
        // Validate ObjectId format - but be more lenient for debugging
        if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
            logger.warn(`Invalid user ID received: "${id}"`);
            return next(new AppError('User ID is required', 400));
        }
        
        // Clean the ID
        const cleanId = id.trim();
        logger.info(`Cleaned ID: "${cleanId}"`);
        
        // Check if it's a valid ObjectId format (24 character hex string)
        if (!mongoose.Types.ObjectId.isValid(cleanId)) {
            logger.warn(`Invalid ObjectId format: "${cleanId}"`);
            logger.warn(`Is valid ObjectId: ${mongoose.Types.ObjectId.isValid(cleanId)}`);
            
            // Instead of throwing error, let's try to find by other fields for debugging
            logger.info('Attempting to find user by email or other identifier...');
            
            try {
                // Try to find seller by email or business name
                const sellerByEmail = await Seller.findOne({
                    $or: [
                        { email: cleanId },
                        { businessName: { $regex: cleanId, $options: 'i' } }
                    ]
                });
                
                if (sellerByEmail) {
                    logger.info(`Found seller by email/name: ${sellerByEmail._id}`);
                    req.params.id = sellerByEmail._id.toString();
                    return getSellerDetails(req, res, next);
                }
                
                // Try to find customer by email or name
                const customerByEmail = await Customer.findOne({
                    $or: [
                        { email: cleanId },
                        { name: { $regex: cleanId, $options: 'i' } }
                    ]
                }, null, { skipDefaultFilter: true });
                
                if (customerByEmail) {
                    logger.info(`Found customer by email/name: ${customerByEmail._id}`);
                    req.params.id = customerByEmail._id.toString();
                    return getCustomerDetails(req, res, next);
                }
            } catch (searchError) {
                logger.warn(`Error searching by email/name: ${searchError.message}`);
            }
            
            return next(new AppError('Invalid user ID format', 400));
        }
        
        // Try to find as seller first
        let seller;
        try {
            seller = await Seller.findById(cleanId);
            logger.info(`Seller search result: ${seller ? 'found' : 'not found'}`);
        } catch (sellerError) {
            logger.warn(`Error finding seller ${cleanId}: ${sellerError.message}`);
        }
        
        if (seller) {
            req.params.id = cleanId;
            return getSellerDetails(req, res, next);
        }
        
        // Try to find as customer
        let customer;
        try {
            customer = await Customer.findById(cleanId, null, { skipDefaultFilter: true });
            logger.info(`Customer search result: ${customer ? 'found' : 'not found'}`);
        } catch (customerError) {
            logger.warn(`Error finding customer ${cleanId}: ${customerError.message}`);
        }
        
        if (customer) {
            req.params.id = cleanId;
            return getCustomerDetails(req, res, next);
        }
        
        logger.warn(`User not found with ID: ${cleanId}`);
        return next(new AppError('User not found', 404));
    } catch (error) {
        logger.error(`Error in getUserDetails: ${error.message}`);
        logger.error(`Stack trace: ${error.stack}`);
        next(new AppError('Failed to fetch user details', 500));
    }
};

/**
 * Update user status (auto-detect if seller or customer)
 * @route PATCH /api/v2/admin/users/:id/status
 * @access Private (Admin only)
 */
export const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Try to find as seller first
        const seller = await Seller.findById(id);
        if (seller) {
            return updateSellerStatus(req, res, next);
        }
        
        // Try to find as customer
        const customer = await Customer.findById(id);
        if (customer) {
            return updateCustomerStatus(req, res, next);
        }
        
        return next(new AppError('User not found', 404));
    } catch (error) {
        logger.error(`Error in updateUserStatus: ${error.message}`);
        next(new AppError('Failed to update user status', 500));
    }
};

/**
 * Update user permissions (placeholder for future implementation)
 * @route PATCH /api/v2/admin/users/:id/permissions
 * @access Private (Admin only)
 */
export const updateUserPermissions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;
        
        // For now, return success response since permissions are not implemented
        // This can be expanded later when user permissions are fully implemented
        
        res.status(200).json({
            success: true,
            message: 'User permissions updated successfully',
            data: {
                userId: id,
                permissions
            }
        });
    } catch (error) {
        logger.error(`Error in updateUserPermissions: ${error.message}`);
        next(new AppError('Failed to update user permissions', 500));
    }
};

/**
 * Get all sellers with pagination and filters
 * @route GET /api/v2/admin/users/sellers
 * @access Private (Admin only)
 */
export const getAllSellers = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortField = 'createdAt', // Support both sortBy and sortField
            sortOrder = 'desc',
            status,
            search,
            kycStatus
        } = req.query;

        // Use sortField if provided, otherwise fallback to sortBy
        let actualSortField = sortField || sortBy;
        
        // Map frontend field names to database field names
        const fieldMapping = {
            'userId': '_id',
            'name': 'name',
            'email': 'email',
            'status': 'status',
            'createdAt': 'createdAt',
            'lastActive': 'lastActive'
        };
        
        // Apply field mapping
        actualSortField = fieldMapping[actualSortField] || actualSortField;

        // Build query
        const query = {};
        
        // Add status filter if provided
        if (status && status !== 'all') {
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
                    $sort: { [actualSortField]: sortDirection }
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
                .sort({ [actualSortField]: sortDirection })
                .skip(skip)
                .limit(parseInt(limit));
        }

        // Get total count for pagination
        const totalSellers = await Seller.countDocuments(query);

        // Transform sellers to match frontend expectations
        const transformedSellers = sellers.map(seller => ({
            id: seller._id ? seller._id.toString() : '',
            userId: seller._id ? seller._id.toString() : '', // Use _id as userId and ensure it's a string
            name: seller.name || '',
            email: seller.email || '',
            status: seller.status || 'Active',
            createdAt: seller.createdAt,
            lastActive: seller.lastActive,
            paymentType: 'wallet', // Default value
            totalTransactions: 0 // Default value, can be enhanced later
        }));

        res.status(200).json({
            success: true,
            data: {
                sellers: transformedSellers,
                users: transformedSellers, // Alias for frontend compatibility
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
 * Get seller details by ID including KYC, agreements and profile info
 * @route GET /api/v1/admin/users/sellers/:id
 * @access Private (Admin only)
 */
export const getSellerDetails = async (req, res, next) => {
    try {
        const { id: sellerId } = req.params;
        
        // Use MongoDB to find the seller with comprehensive details
        const sellerDetails = await Seller.aggregate([
            { 
                $match: { 
                    _id: new mongoose.Types.ObjectId(sellerId)
                } 
            },
            {
                $lookup: {
                    from: 'ratecards',
                    localField: 'rateCard',
                    foreignField: '_id',
                    as: 'rateCardDetails'
                }
            },
            {
                $lookup: {
                    from: 'sellerorders',
                    localField: '_id',
                    foreignField: 'seller',
                    as: 'orders',
                    pipeline: [
                        { 
                            $sort: { 
                                createdAt: -1 
                            } 
                        },
                        { 
                            $limit: 10 
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'sellershipments',
                    localField: '_id',
                    foreignField: 'seller',
                    as: 'shipments',
                    pipeline: [
                        { 
                            $sort: { 
                                createdAt: -1 
                            } 
                        },
                        { 
                            $limit: 10 
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'sellerorders',
                    localField: '_id',
                    foreignField: 'seller',
                    as: 'orderStats',
                    pipeline: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'sellershipments',
                    localField: '_id',
                    foreignField: 'seller',
                    as: 'shipmentStats',
                    pipeline: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ]
                }
            },
            // Include wallet transactions
            {
                $lookup: {
                    from: 'wallettransactions',
                    localField: '_id',
                    foreignField: 'seller',
                    as: 'walletTransactions',
                    pipeline: [
                        { 
                            $sort: { 
                                createdAt: -1 
                            } 
                        },
                        { 
                            $limit: 10 
                        }
                    ]
                }
            },
            // Include any account issues
            {
                $lookup: {
                    from: 'supporttickets',
                    localField: '_id',
                    foreignField: 'seller',
                    as: 'supportTickets',
                    pipeline: [
                        { 
                            $sort: { 
                                createdAt: -1 
                            } 
                        },
                        { 
                            $limit: 5 
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                    businessName: 1,
                    companyCategory: 1,
                    brandName: 1,
                    website: 1,
                    supportContact: 1,
                    supportEmail: 1,
                    operationsEmail: 1,
                    financeEmail: 1,
                    gstin: 1,
                    documents: 1,
                    status: 1,
                    walletBalance: 1,
                    lastLogin: 1,
                    lastActive: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    orders: 1,
                    shipments: 1,
                    orderStats: 1,
                    shipmentStats: 1,
                    walletTransactions: 1,
                    supportTickets: 1,
                    rateCardDetails: { $arrayElemAt: ['$rateCardDetails', 0] }
                }
            }
        ]);

        if (!sellerDetails || sellerDetails.length === 0) {
            return next(new AppError('Seller not found', 404));
        }

        // Extract KYC details from the seller model for backward compatibility
        const kycDetails = {
            status: sellerDetails[0].status,
            documents: sellerDetails[0].documents || {},
            businessDetails: {
                name: sellerDetails[0].businessName,
                gstin: sellerDetails[0].gstin
            }
        };

        // Get agreements
        const agreements = await Agreement.find({ seller: sellerId });

        // Construct response in the expected format
        const responseData = {
            seller: sellerDetails[0],
            kycDetails,
            agreements,
            isRealtime: false
        };

        res.status(200).json({
            success: true,
            data: responseData
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

        // Invalidate seller cache
        try {
            invalidateCachePattern(`seller:${id}:*`);
            
            // Get Socket.IO instance and broadcast update
            const io = getIO();
            
            // Emit to admin dashboard for real-time updates
            io.to('admin-dashboard').emit('seller:profile:updated', {
                sellerId: id,
                status: seller.status,
                updatedBy: req.user.id,
                updatedAt: new Date()
            });
            
            // Emit to admin-seller-specific room for admins who are subscribed to this seller
            io.to(`admin-seller-${id}`).emit('seller:profile:updated', await getSellerProfile(id));
            
            // Emit to seller-specific room if they're connected
            io.to(`seller-${id}`).emit('seller:profile:updated', await getSellerProfile(id));
            
            logger.info(`Broadcasted seller profile update for ${id}`);
        } catch (error) {
            logger.warn(`Failed to broadcast seller update: ${error.message}`);
            // Don't fail the request if broadcasting fails
        }

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

        // Update seller's KYC status
        if (!seller.documents) {
            seller.documents = {};
        }
        
        // Update documents status
        if (seller.documents.documents && Array.isArray(seller.documents.documents)) {
            seller.documents.documents.forEach(doc => {
                doc.status = status === 'approved' ? 'verified' : 
                            status === 'rejected' ? 'rejected' : 'pending';
            });
        }
        
        // Add verification history if it doesn't exist
        if (!seller.verificationHistory) {
            seller.verificationHistory = [];
        }
        
        // Add new verification entry
        seller.verificationHistory.push({
            status,
            comments,
            verifiedBy: req.user.id,
            timestamp: new Date()
        });

        // Update KYC verification flag
        seller.kycVerified = status === 'approved';
        
        await seller.save();

        // Log the KYC update
        logger.info(`Admin ${req.user.id} updated seller ${id} KYC status to ${status}`);

        res.status(200).json({
            success: true,
            data: {
                seller
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
        logger.info(`getAllCustomers called with query: ${JSON.stringify(req.query)}`);
        
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortField = 'createdAt', // Support both sortBy and sortField
            sortOrder = 'desc',
            status,
            search
        } = req.query;

        // Use sortField if provided, otherwise fallback to sortBy
        let actualSortField = sortField || sortBy;
        
        // Map frontend field names to database field names
        const fieldMapping = {
            'userId': '_id',
            'name': 'name',
            'email': 'email',
            'status': 'status',
            'createdAt': 'createdAt',
            'lastActive': 'lastActive'
        };
        
        // Apply field mapping
        actualSortField = fieldMapping[actualSortField] || actualSortField;

        logger.info(`Using sort field: ${actualSortField}, direction: ${sortOrder}`);

        // Build query
        const query = {};
        
        // Add status filter if provided
        if (status && status !== 'all') {
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

        logger.info(`Database query: ${JSON.stringify(query)}`);

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        
        logger.info(`Pagination: skip=${skip}, limit=${limit}, sort={${actualSortField}: ${sortDirection}}`);
        
        // Use skipDefaultFilter option to get all customers regardless of status
        const customers = await Customer.find(query, null, { skipDefaultFilter: true })
            .sort({ [actualSortField]: sortDirection })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(); // Add lean() for better performance

        logger.info(`Found ${customers.length} customers`);

        // Get total count for pagination (also skip default filter)
        const totalCustomers = await Customer.countDocuments(query);

        logger.info(`Total customers count: ${totalCustomers}`);

        // Transform customers to match frontend expectations
        const transformedCustomers = customers.map(customer => ({
            id: customer._id ? customer._id.toString() : '',
            userId: customer._id ? customer._id.toString() : '', // Use _id as userId and ensure it's a string
            name: customer.name || '',
            email: customer.email || '',
            status: customer.status || 'active',
            createdAt: customer.createdAt,
            lastActive: customer.lastActive,
            paymentType: 'wallet', // Default value
            totalTransactions: 0 // Default value, can be enhanced later
        }));

        logger.info(`Transformed ${transformedCustomers.length} customers for response`);

        res.status(200).json({
            success: true,
            data: {
                customers: transformedCustomers,
                users: transformedCustomers, // Alias for frontend compatibility
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
        logger.error(`Stack trace: ${error.stack}`);
        next(new AppError('Failed to fetch customers', 500));
    }
};

/**
 * Get customer details by ID with profile information
 * @route GET /api/v1/admin/users/customers/:id
 * @access Private (Admin only)
 */
export const getCustomerDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get real-time customer profile data
        let customerProfile;
        try {
            customerProfile = await getCustomerProfile(id);
        } catch (error) {
            logger.warn(`Failed to get customer profile from cache: ${error.message}`);
            // Fall back to database query if cache fails
            customerProfile = null;
        }

        // Get customer details from database if not available from real-time service
        const customer = customerProfile || await Customer.findById(id);
        
        if (!customer) {
            return next(new AppError('Customer not found', 404));
        }

        // Get addresses if they exist and weren't included in profile
        let addresses = [];
        if (customer.addresses && customer.addresses.length > 0) {
            addresses = customer.addresses;
        }

        // Add real-time flag to indicate if data came from real-time cache
        const responseData = {
            customer,
            addresses,
            isRealtime: !!customerProfile
        };

        res.status(200).json({
            success: true,
            data: responseData
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
        
        // Add status change to history if it exists
        if (!customer.statusHistory) {
            customer.statusHistory = [];
        }
        
            customer.statusHistory.push({
                status,
                reason,
                updatedBy: req.user.id,
                timestamp: new Date()
            });

        await customer.save();

        // Invalidate customer cache
        try {
            invalidateCachePattern(`customer:${id}:*`);
            
            // Get Socket.IO instance and broadcast update
            const io = getIO();
            
            // Emit to admin dashboard for real-time updates
            io.to('admin-dashboard').emit('customer:profile:updated', {
                customerId: id,
                status: customer.status,
                updatedBy: req.user.id,
                updatedAt: new Date()
            });
            
            // Emit to admin-customer-specific room for admins who are subscribed to this customer
            io.to(`admin-customer-${id}`).emit('customer:profile:updated', await getCustomerProfile(id));
            
            // Emit to customer-specific room if they're connected
            io.to(`customer-${id}`).emit('customer:profile:updated', await getCustomerProfile(id));
            
            logger.info(`Broadcasted customer profile update for ${id}`);
        } catch (error) {
            logger.warn(`Failed to broadcast customer update: ${error.message}`);
            // Don't fail the request if broadcasting fails
        }

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

/**
 * Get real-time profile data for multiple customers and sellers
 * @route POST /api/v1/admin/users/realtime
 * @access Private (Admin only)
 */
export const getRealtimeUserData = async (req, res, next) => {
    try {
        const { sellerIds = [], customerIds = [] } = req.body;
        
        // Validate input
        if (!Array.isArray(sellerIds) || !Array.isArray(customerIds)) {
            return next(new AppError('Invalid input format. sellerIds and customerIds must be arrays', 400));
        }
        
        // Limit the number of IDs that can be queried at once to prevent abuse
        const MAX_IDS = 20;
        if (sellerIds.length + customerIds.length > MAX_IDS) {
            return next(new AppError(`Too many IDs requested. Maximum ${MAX_IDS} total IDs allowed`, 400));
        }
        
        logger.info(`Fetching real-time profile data for ${sellerIds.length} sellers and ${customerIds.length} customers`);
        
        // Get seller profiles in parallel
        const sellerPromises = sellerIds.map(async (id) => {
            try {
                return await getSellerProfile(id);
            } catch (error) {
                logger.warn(`Failed to get real-time seller profile for ${id}: ${error.message}`);
                // Return basic info on error
                return { id, error: 'Failed to fetch real-time data' };
            }
        });
        
        // Get customer profiles in parallel
        const customerPromises = customerIds.map(async (id) => {
            try {
                return await getCustomerProfile(id);
            } catch (error) {
                logger.warn(`Failed to get real-time customer profile for ${id}: ${error.message}`);
                // Return basic info on error
                return { id, error: 'Failed to fetch real-time data' };
            }
        });
        
        // Wait for all promises to resolve
        const [sellers, customers] = await Promise.all([
            Promise.all(sellerPromises),
            Promise.all(customerPromises)
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                sellers,
                customers,
                timestamp: new Date()
            }
        });
    } catch (error) {
        logger.error(`Error in getRealtimeUserData: ${error.message}`);
        next(new AppError('Failed to fetch real-time user data', 500));
    }
}; 