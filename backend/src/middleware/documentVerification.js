import { AppError } from './errorHandler.js';

/**
 * Get document upload status for a seller
 * @param {Object} seller - Seller object from database
 * @returns {Object} Document status information
 */
export const getDocumentUploadStatus = (seller) => {
  try {
    if (!seller) {
      return {
        documentsUploaded: false,
        adminVerified: false,
        completionPercentage: 0,
        missingDocuments: ['gstin', 'pan', 'aadhaar'],
        uploadedDocuments: [],
        status: 'pending_upload'
      };
    }

    const requiredDocuments = ['gstin', 'pan', 'aadhaar'];
    const uploadedDocuments = [];
    const missingDocuments = [];

    // Check each required document
    requiredDocuments.forEach(docType => {
      const document = seller.documents?.[docType];
      if (document && document.url && document.number) {
        uploadedDocuments.push(docType);
      } else {
        missingDocuments.push(docType);
      }
    });

    const uploadCompletionPercentage = Math.round((uploadedDocuments.length / requiredDocuments.length) * 100);
    const documentsUploaded = uploadedDocuments.length === requiredDocuments.length;

    // Check admin verification status
    const adminVerified = seller.status === 'verified' || seller.documentsVerified === true;

    // Determine overall status
    let status = 'pending_upload';
    if (documentsUploaded && adminVerified) {
      status = 'verified';
    } else if (documentsUploaded && !adminVerified) {
      status = 'pending_admin_verification';
    }

    return {
      documentsUploaded,
      adminVerified,
      completionPercentage: uploadCompletionPercentage,
      uploadedDocuments,
      missingDocuments,
      totalRequired: requiredDocuments.length,
      totalUploaded: uploadedDocuments.length,
      status,
      message: status === 'verified'
        ? 'All documents verified by admin'
        : status === 'pending_admin_verification'
          ? 'Documents uploaded. Awaiting admin verification.'
          : 'Please upload all required documents'
    };
  } catch (error) {
    console.error('Error getting document upload status:', error);
    return {
      documentsUploaded: false,
      adminVerified: false,
      completionPercentage: 0,
      missingDocuments: ['gstin', 'pan', 'aadhaar'],
      uploadedDocuments: [],
      status: 'pending_upload'
    };
  }
};

/**
 * Middleware to require basic profile completion
 */
export const requireBasicProfile = async (req, res, next) => {
  try {
    const seller = req.user;

    if (!seller) {
      return next(new AppError('Authentication required', 401));
    }

    // Check if basic profile info is complete
    const hasBasicInfo = seller.firstName && seller.lastName && seller.email && seller.phone;
    const hasBusinessInfo = seller.businessName;

    if (!hasBasicInfo || !hasBusinessInfo) {
      return next(new AppError('Please complete your basic profile information first', 403));
    }

    next();
  } catch (error) {
    next(new AppError('Profile verification failed', 500));
  }
};

/**
 * Middleware to require admin-verified documents for critical business operations
 */
export const requireDocumentUpload = async (req, res, next) => {
  try {
    const seller = req.user;

    if (!seller) {
      return next(new AppError('Authentication required', 401));
    }

    const documentStatus = getDocumentUploadStatus(seller);

    // Require both document upload AND admin verification for critical operations
    if (!documentStatus.adminVerified) {
      return res.status(403).json({
        success: false,
        error: 'Admin verification required',
        message: documentStatus.documentsUploaded
          ? 'Your documents are pending admin verification. Please wait for approval to access this feature.'
          : 'Please upload all required documents and wait for admin verification to access this feature.',
        data: {
          status: documentStatus.status,
          documentsUploaded: documentStatus.documentsUploaded,
          adminVerified: documentStatus.adminVerified,
          requiredDocuments: documentStatus.missingDocuments,
          completionPercentage: documentStatus.completionPercentage
        }
      });
    }

    next();
  } catch (error) {
    next(new AppError('Document verification failed', 500));
  }
};

/**
 * Progressive document access middleware - allows access based on document upload percentage
 * (Note: This only checks upload completion, not admin verification)
 * @param {number} requiredPercentage - Minimum upload completion percentage required
 */
export const progressiveDocumentAccess = (requiredPercentage = 50) => {
  return async (req, res, next) => {
    try {
      const seller = req.user;

      if (!seller) {
        return next(new AppError('Authentication required', 401));
      }

      const documentStatus = getDocumentUploadStatus(seller);

      if (documentStatus.completionPercentage < requiredPercentage) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient document upload',
          message: `Please upload at least ${requiredPercentage}% of required documents to access this feature`,
          data: {
            currentPercentage: documentStatus.completionPercentage,
            requiredPercentage,
            missingDocuments: documentStatus.missingDocuments,
            status: documentStatus.status,
            note: 'Admin verification not required for this feature'
          }
        });
      }

      next();
    } catch (error) {
      next(new AppError('Document verification failed', 500));
    }
  };
};

// Export alias for backward compatibility
export const checkDocumentUploadStatus = getDocumentUploadStatus;
