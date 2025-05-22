import Seller from '../models/seller.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import mongoose from 'mongoose';

// Get seller profile
export const getProfile = async (req, res, next) => {
    try {
        const seller = await Seller.findById(req.user.id);
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }
        res.status(200).json({
            success: true,
            data: seller
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Update seller profile
export const updateProfile = async (req, res, next) => {
    try {
        const seller = await Seller.findById(req.user.id);
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }

        const updatedSeller = await seller.updateSafe(req.body);
        res.status(200).json({
            success: true,
            data: updatedSeller
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Update company details
export const updateCompanyDetails = async (req, res, next) => {
    try {
        const seller = await Seller.findById(req.user.id);
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }

        const { companyCategory, documents, address } = req.body;

        // Update company category
        seller.companyCategory = companyCategory;

        // Update documents
        if (documents) {
            if (documents.gstin) {
                seller.documents.gstin = {
                    ...seller.documents.gstin,
                    ...documents.gstin,
                    status: 'pending'
                };
            }
            if (documents.pan) {
                seller.documents.pan = {
                    ...seller.documents.pan,
                    ...documents.pan,
                    status: 'pending'
                };
            }
            if (documents.aadhaar) {
                seller.documents.aadhaar = {
                    ...seller.documents.aadhaar,
                    ...documents.aadhaar,
                    status: 'pending'
                };
            }
        }

        // Update address
        if (address) {
            seller.address = {
                ...seller.address,
                ...address
            };
        }

        await seller.save();

        res.status(200).json({
            success: true,
            data: seller
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Update bank details
export const updateBankDetails = async (req, res, next) => {
    try {
        const seller = await Seller.findById(req.user.id);
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }

        const { accountType, bankName, accountNumber, accountHolderName, ifscCode, cancelledCheque } = req.body;

        // Update bank details
        seller.bankDetails = {
            accountType,
            bankName,
            accountNumber,
            accountHolderName,
            ifscCode,
            cancelledCheque: {
                ...cancelledCheque,
                status: 'pending'
            }
        };

        await seller.save();

        res.status(200).json({
            success: true,
            data: seller
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get seller documents
export const getDocuments = async (req, res, next) => {
    try {
        const seller = await Seller.findById(req.user.id);
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }
        res.status(200).json({
            success: true,
            data: seller.documents
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Update document
export const updateDocument = async (req, res, next) => {
    try {
        const seller = await Seller.findById(req.user.id);
        if (!seller) {
            return next(new AppError('Seller not found', 404));
        }

        const { documentType, documentNumber, documentUrl, documentName } = req.body;

        // Handle different document types
        switch (documentType) {
            case 'gstin':
                seller.documents.gstin = {
                    number: documentNumber,
                    url: documentUrl,
                    status: 'pending'
                };
                break;
            case 'pan':
                seller.documents.pan = {
                    number: documentNumber,
                    url: documentUrl,
                    status: 'pending'
                };
                break;
            case 'aadhaar':
                seller.documents.aadhaar = {
                    number: documentNumber,
                    url: documentUrl,
                    status: 'pending'
                };
                break;
            case 'other':
                if (!documentName) {
                    return next(new AppError('Document name is required for other documents', 400));
                }
                seller.documents.others.push({
                    name: documentName,
                    type: documentType,
                    url: documentUrl,
                    status: 'pending'
                });
                break;
            default:
                return next(new AppError('Invalid document type', 400));
        }

        await seller.save();

        res.status(200).json({
            success: true,
            data: seller.documents
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
}; 