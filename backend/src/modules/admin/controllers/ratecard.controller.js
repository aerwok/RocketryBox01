import RateCard from '../../../models/ratecard.model.js';
import rateCardService from '../../../services/ratecard.service.js';
import { logger } from '../../../utils/logger.js';
import { AppError } from '../../../middleware/errorHandler.js';

/**
 * Get all rate cards with filters and pagination
 * @route GET /api/v2/admin/ratecards
 * @access Private (Admin only)
 */
export const getAllRateCards = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 50,
            courier,
            zone,
            mode,
            isActive = true
        } = req.query;

        // Build filter object
        const filters = { isActive: isActive === 'true' };
        if (courier) filters.courier = courier;
        if (zone) filters.zone = zone;
        if (mode) filters.mode = mode;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get rate cards with pagination
        const rateCards = await RateCard.find(filters)
            .sort({ courier: 1, zone: 1, mode: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const totalCount = await RateCard.countDocuments(filters);

        // Get statistics
        const statsResult = await rateCardService.getStatistics();
        const statistics = statsResult.success ? statsResult.statistics : null;

        res.status(200).json({
            success: true,
            data: {
                rateCards,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalCount / parseInt(limit)),
                    totalResults: totalCount
                },
                statistics,
                filters
            }
        });
    } catch (error) {
        logger.error(`Error in getAllRateCards: ${error.message}`);
        next(new AppError('Failed to fetch rate cards', 500));
    }
};

/**
 * Get rate card by ID
 * @route GET /api/v2/admin/ratecards/:id
 * @access Private (Admin only)
 */
export const getRateCardById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const rateCard = await RateCard.findById(id);

        if (!rateCard) {
            return next(new AppError('Rate card not found', 404));
        }

        res.status(200).json({
            success: true,
            data: {
                rateCard
            }
        });
    } catch (error) {
        logger.error(`Error in getRateCardById: ${error.message}`);
        next(new AppError('Failed to fetch rate card', 500));
    }
};

/**
 * Create new rate cards (bulk)
 * @route POST /api/v2/admin/ratecards
 * @access Private (Admin only)
 */
export const createRateCards = async (req, res, next) => {
    try {
        const { rateCards } = req.body;

        if (!Array.isArray(rateCards)) {
            return next(new AppError('Rate cards must be an array', 400));
        }

        const createdRateCards = [];
        const updatedRateCards = [];
        const errors = [];

        // Process each rate card
        for (const rateCardData of rateCards) {
            try {
                const result = await rateCardService.createOrUpdateRateCard(rateCardData);
                
                if (result.success) {
                    if (result.isNew) {
                        createdRateCards.push(result.rateCard);
                    } else {
                        updatedRateCards.push(result.rateCard);
                    }
                } else {
                    errors.push(result.error);
                }
            } catch (cardError) {
                errors.push(`Error processing rate card: ${cardError.message}`);
            }
        }

        // Log the operation
        logger.info(`Admin ${req.user.id} processed ${rateCards.length} rate cards: ${createdRateCards.length} created, ${updatedRateCards.length} updated, ${errors.length} errors`);

        res.status(200).json({
            success: true,
            data: {
                created: createdRateCards,
                updated: updatedRateCards,
                errors: errors.length > 0 ? errors : undefined,
                summary: {
                    totalProcessed: rateCards.length,
                    created: createdRateCards.length,
                    updated: updatedRateCards.length,
                    failed: errors.length
                }
            }
        });
    } catch (error) {
        logger.error(`Error in createRateCards: ${error.message}`);
        next(new AppError('Failed to create rate cards', 500));
    }
};

/**
 * Update rate card by ID
 * @route PATCH /api/v2/admin/ratecards/:id
 * @access Private (Admin only)
 */
export const updateRateCard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const rateCard = await RateCard.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!rateCard) {
            return next(new AppError('Rate card not found', 404));
        }

        logger.info(`Admin ${req.user.id} updated rate card ${id}`);

        res.status(200).json({
            success: true,
            data: {
                rateCard
            }
        });
    } catch (error) {
        logger.error(`Error in updateRateCard: ${error.message}`);
        next(new AppError('Failed to update rate card', 500));
    }
};

/**
 * Deactivate rate card
 * @route PATCH /api/v2/admin/ratecards/:id/deactivate
 * @access Private (Admin only)
 */
export const deactivateRateCard = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await rateCardService.deactivateRateCard(id);

        if (!result.success) {
            return next(new AppError(result.error, 404));
        }

        logger.info(`Admin ${req.user.id} deactivated rate card ${id}`);

        res.status(200).json({
            success: true,
            data: {
                rateCard: result.rateCard
            },
            message: 'Rate card deactivated successfully'
        });
    } catch (error) {
        logger.error(`Error in deactivateRateCard: ${error.message}`);
        next(new AppError('Failed to deactivate rate card', 500));
    }
};

/**
 * Delete rate card (permanent)
 * @route DELETE /api/v2/admin/ratecards/:id
 * @access Private (Admin only - SuperAdmin)
 */
export const deleteRateCard = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if user is superAdmin
        if (!req.user.isSuperAdmin) {
            return next(new AppError('Only super administrators can delete rate cards', 403));
        }

        const rateCard = await RateCard.findByIdAndDelete(id);

        if (!rateCard) {
            return next(new AppError('Rate card not found', 404));
        }

        logger.info(`SuperAdmin ${req.user.id} deleted rate card ${id}`);

        res.status(200).json({
            success: true,
            message: 'Rate card deleted successfully'
        });
    } catch (error) {
        logger.error(`Error in deleteRateCard: ${error.message}`);
        next(new AppError('Failed to delete rate card', 500));
    }
};

/**
 * Get rate card statistics
 * @route GET /api/v2/admin/ratecards/statistics
 * @access Private (Admin only)
 */
export const getRateCardStatistics = async (req, res, next) => {
    try {
        const result = await rateCardService.getStatistics();

        if (!result.success) {
            return next(new AppError(result.error, 500));
        }

        res.status(200).json({
            success: true,
            data: result.statistics
        });
    } catch (error) {
        logger.error(`Error in getRateCardStatistics: ${error.message}`);
        next(new AppError('Failed to fetch statistics', 500));
    }
};

/**
 * Get active couriers
 * @route GET /api/v2/admin/ratecards/couriers
 * @access Private (Admin only)
 */
export const getActiveCouriers = async (req, res, next) => {
    try {
        const result = await rateCardService.getActiveCouriers();

        if (!result.success) {
            return next(new AppError(result.error, 500));
        }

        res.status(200).json({
            success: true,
            data: {
                couriers: result.couriers
            }
        });
    } catch (error) {
        logger.error(`Error in getActiveCouriers: ${error.message}`);
        next(new AppError('Failed to fetch couriers', 500));
    }
};

/**
 * Import rate cards from JSON (for data migration)
 * @route POST /api/v2/admin/ratecards/import
 * @access Private (Admin only - SuperAdmin)
 */
export const importRateCards = async (req, res, next) => {
    try {
        const { rateCards, clearExisting = false } = req.body;

        // Check if user is superAdmin
        if (!req.user.isSuperAdmin) {
            return next(new AppError('Only super administrators can import rate cards', 403));
        }

        if (!Array.isArray(rateCards)) {
            return next(new AppError('Rate cards must be an array', 400));
        }

        // Clear existing data if requested
        if (clearExisting) {
            await RateCard.deleteMany({});
            logger.info(`SuperAdmin ${req.user.id} cleared existing rate cards before import`);
        }

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        // Import each rate card
        for (const rateCardData of rateCards) {
            try {
                const newRateCard = new RateCard(rateCardData);
                await newRateCard.save();
                results.push({ success: true, data: newRateCard });
                successCount++;
            } catch (error) {
                results.push({ success: false, error: error.message, data: rateCardData });
                errorCount++;
            }
        }

        logger.info(`SuperAdmin ${req.user.id} imported rate cards: ${successCount} success, ${errorCount} errors`);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalProcessed: rateCards.length,
                    successful: successCount,
                    failed: errorCount,
                    clearedExisting: clearExisting
                },
                results: results.slice(0, 10) // Show first 10 results only
            },
            message: `Import completed: ${successCount} rate cards imported successfully`
        });
    } catch (error) {
        logger.error(`Error in importRateCards: ${error.message}`);
        next(new AppError('Failed to import rate cards', 500));
    }
}; 