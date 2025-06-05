// Document Upload Enforcement Middleware
// Enforces document upload requirements for sellers (verification handled later by admin KYC)

import { AppError } from './errorHandler.js';

/**
 * Check if seller has uploaded all required documents
 * @param {Object} seller - Seller object from database
 * @returns {Object} - Document upload status analysis
 */
export const checkDocumentUploadStatus = (seller) => {
  const documents = seller.documents || {};

  // Required documents for upload (verification comes later via admin KYC)
  const requiredDocs = ['gstin', 'pan', 'aadhaar'];
  const requiredBankDoc = seller.bankDetails?.cancelledCheque?.url;

  // Check which documents are uploaded
  const uploadedDocs = requiredDocs.filter(docType =>
    documents[docType] && documents[docType].url
  );

  const bankDocUploaded = !!requiredBankDoc;

  // Calculate missing documents
  const missingDocuments = requiredDocs.filter(docType =>
    !documents[docType] || !documents[docType].url
  );

  const allDocumentsUploaded = uploadedDocs.length === requiredDocs.length && bankDocUploaded;
  const completionPercentage = Math.round(((uploadedDocs.length + (bankDocUploaded ? 1 : 0)) / (requiredDocs.length + 1)) * 100);

  return {
    totalRequired: requiredDocs.length + 1, // +1 for bank document
    uploaded: uploadedDocs.length + (bankDocUploaded ? 1 : 0),
    allUploaded: allDocumentsUploaded,
    missingDocuments,
    bankDocumentMissing: !bankDocUploaded,
    completionPercentage,
    isComplete: allDocumentsUploaded
  };
};

/**
 * Middleware: Require all documents to be uploaded
 * Blocks access to business operations until documents are uploaded
 * (Verification will be handled later by admin KYC)
 */
export const requireDocumentUpload = async (req, res, next) => {
  try {
    const seller = req.user;

    if (!seller) {
      return next(new AppError('Authentication required', 401));
    }

    const uploadStatus = checkDocumentUploadStatus(seller);

    if (!uploadStatus.allUploaded) {
      return res.status(403).json({
        success: false,
        error: 'Document upload required',
        message: 'Please upload all required documents to access business features. Verification will be completed by our team.',
        data: {
          completionPercentage: uploadStatus.completionPercentage,
          uploaded: uploadStatus.uploaded,
          totalRequired: uploadStatus.totalRequired,
          missingDocuments: uploadStatus.missingDocuments,
          bankDocumentMissing: uploadStatus.bankDocumentMissing,
          requiredActions: [
            ...uploadStatus.missingDocuments.map(doc => `Upload ${doc.toUpperCase()} document`),
            ...(uploadStatus.bankDocumentMissing ? ['Upload cancelled cheque'] : [])
          ],
          nextSteps: [
            'Upload all required documents',
            'Admin team will verify your documents',
            'You will be notified once verification is complete'
          ]
        }
      });
    }

    // Documents uploaded - allow access (verification handled separately by admin)
    next();
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * Middleware: Progressive access based on document upload completion
 * Allows different features based on upload completion level
 */
export const progressiveDocumentAccess = (requiredLevel = 100) => {
  return async (req, res, next) => {
    try {
      const seller = req.user;

      if (!seller) {
        return next(new AppError('Authentication required', 401));
      }

      const uploadStatus = checkDocumentUploadStatus(seller);

      if (uploadStatus.completionPercentage < requiredLevel) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient document completion',
          message: `This feature requires ${requiredLevel}% document upload completion. You are at ${uploadStatus.completionPercentage}%`,
          data: {
            currentCompletion: uploadStatus.completionPercentage,
            requiredCompletion: requiredLevel,
            missingDocuments: uploadStatus.missingDocuments,
            bankDocumentMissing: uploadStatus.bankDocumentMissing,
            hint: 'Complete document upload to unlock all features'
          }
        });
      }

      next();
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  };
};

/**
 * Check if basic profile info is complete
 * Used for step-by-step onboarding
 */
export const requireBasicProfile = async (req, res, next) => {
  try {
    const seller = req.user;

    if (!seller) {
      return next(new AppError('Authentication required', 401));
    }

    // Check if basic profile fields are complete
    const missingFields = [];

    if (!seller.businessName) missingFields.push('Business Name');
    if (!seller.companyCategory) missingFields.push('Company Category');
    if (!seller.address?.city) missingFields.push('Business Address');
    if (!seller.phone) missingFields.push('Phone Number');

    if (missingFields.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'Profile incomplete',
        message: 'Please complete your basic profile information first',
        data: {
          missingFields,
          nextAction: 'Complete profile setup',
          redirectTo: '/seller/dashboard/profile'
        }
      });
    }

    next();
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * Get document upload status for dashboard
 * Shows progress and requirements to sellers
 */
export const getDocumentUploadStatus = (seller) => {
  const uploadStatus = checkDocumentUploadStatus(seller);

  return {
    isComplete: uploadStatus.allUploaded,
    completionPercentage: uploadStatus.completionPercentage,
    status: uploadStatus.allUploaded ? 'uploaded' : 'incomplete',
    requirements: {
      documents: {
        gstin: {
          uploaded: !!(seller.documents?.gstin?.url),
          required: true,
          label: 'GST Certificate'
        },
        pan: {
          uploaded: !!(seller.documents?.pan?.url),
          required: true,
          label: 'PAN Card'
        },
        aadhaar: {
          uploaded: !!(seller.documents?.aadhaar?.url),
          required: true,
          label: 'Aadhaar Card'
        },
        cancelledCheque: {
          uploaded: !!(seller.bankDetails?.cancelledCheque?.url),
          required: true,
          label: 'Cancelled Cheque'
        }
      }
    },
    nextActions: [
      ...uploadStatus.missingDocuments.map(doc => ({
        action: 'upload',
        document: doc,
        description: `Upload ${doc.toUpperCase()} document`,
        priority: 'high'
      })),
      ...(uploadStatus.bankDocumentMissing ? [{
        action: 'upload',
        document: 'cancelledCheque',
        description: 'Upload cancelled cheque',
        priority: 'high'
      }] : [])
    ],
    message: uploadStatus.allUploaded ?
      'All documents uploaded successfully! Our team will verify them shortly.' :
      'Please upload all required documents to start using business features.'
  };
};
