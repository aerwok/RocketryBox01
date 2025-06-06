import { AppError } from '../../../middleware/errorHandler.js';
import Seller from '../models/seller.model.js';

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

    // Handle address field mapping: frontend sends postalCode, backend expects pincode
    const updateData = { ...req.body };
    if (updateData.address && updateData.address.postalCode) {
      updateData.address.pincode = updateData.address.postalCode;
      delete updateData.address.postalCode;
    }

    const updatedSeller = await seller.updateSafe(updateData);
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
      // Handle field mapping: frontend sends postalCode, backend expects pincode
      if (address.postalCode) {
        address.pincode = address.postalCode;
        delete address.postalCode;
      }

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

    // Create completely flat, React-safe response structure
    // Each document field is a simple primitive value to prevent rendering errors
    const documentsData = {
      // GST Document - flat structure
      gstinNumber: seller.documents?.gstin?.number || '',
      gstinUrl: seller.documents?.gstin?.url || '',
      gstinStatus: seller.documents?.gstin?.status || 'pending',
      gstinUploaded: !!(seller.documents?.gstin?.url),

      // PAN Document - flat structure
      panNumber: seller.documents?.pan?.number || '',
      panUrl: seller.documents?.pan?.url || '',
      panStatus: seller.documents?.pan?.status || 'pending',
      panUploaded: !!(seller.documents?.pan?.url),

      // Aadhaar Document - flat structure
      aadhaarNumber: seller.documents?.aadhaar?.number || '',
      aadhaarUrl: seller.documents?.aadhaar?.url || '',
      aadhaarStatus: seller.documents?.aadhaar?.status || 'pending',
      aadhaarUploaded: !!(seller.documents?.aadhaar?.url),

      // Cancelled Cheque - flat structure
      cancelledChequeUrl: seller.bankDetails?.cancelledCheque?.url || '',
      cancelledChequeStatus: seller.bankDetails?.cancelledCheque?.status || 'pending',
      cancelledChequeUploaded: !!(seller.bankDetails?.cancelledCheque?.url),

      // Other documents count
      otherDocumentsCount: seller.documents?.others?.length || 0,

      // Overall status - simple primitives
      totalRequired: 4,
      totalUploaded: [
        !!(seller.documents?.gstin?.url),
        !!(seller.documents?.pan?.url),
        !!(seller.documents?.aadhaar?.url),
        !!(seller.bankDetails?.cancelledCheque?.url)
      ].filter(Boolean).length,
      completionPercentage: Math.round([
        !!(seller.documents?.gstin?.url),
        !!(seller.documents?.pan?.url),
        !!(seller.documents?.aadhaar?.url),
        !!(seller.bankDetails?.cancelledCheque?.url)
      ].filter(Boolean).length / 4 * 100),
      allCompleted: [
        !!(seller.documents?.gstin?.url),
        !!(seller.documents?.pan?.url),
        !!(seller.documents?.aadhaar?.url),
        !!(seller.bankDetails?.cancelledCheque?.url)
      ].every(Boolean)
    };

    // Also provide original structure for any existing code that needs it
    // But keep it in a separate field to avoid accidental rendering
    const legacyData = {
      gstin: seller.documents?.gstin || { status: 'pending' },
      pan: seller.documents?.pan || { status: 'pending' },
      aadhaar: seller.documents?.aadhaar || { status: 'pending' },
      others: seller.documents?.others || []
    };

    res.status(200).json({
      success: true,
      data: documentsData,
      legacy: legacyData,
      message: 'Documents retrieved successfully'
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

// Update store links
export const updateStoreLinks = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return next(new AppError('Seller not found', 404));
    }

    const { storeLinks } = req.body;

    if (!storeLinks || typeof storeLinks !== 'object') {
      return next(new AppError('Store links data is required', 400));
    }

    // Update store links
    seller.storeLinks = {
      ...seller.storeLinks,
      ...storeLinks
    };

    await seller.save();

    res.status(200).json({
      success: true,
      data: seller,
      message: 'Store links updated successfully'
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};
