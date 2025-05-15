import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { logger } from './logger.js';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Upload file to S3 bucket
 * @param {Object} file - Express multer file object
 * @param {String} key - S3 object key path
 * @returns {Promise<String>} - URL of the uploaded file
 */
export const uploadToS3 = async (file, key) => {
  try {
    // Check if S3 is configured
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.AWS_BUCKET_NAME
    ) {
      logger.warn('AWS S3 not configured, saving file locally');
      return saveLocally(file);
    }

    // Generate unique key if not provided
    const objectKey = key || `uploads/${Date.now()}-${file.originalname}`;

    // Create params for S3 upload
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: objectKey,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype
    };

    // Upload to S3
    const command = new PutObjectCommand(params);
    const result = await s3Client.send(command);

    // Clean up local file after upload
    fs.unlink(file.path, (err) => {
      if (err) logger.error(`Error deleting temporary file: ${err.message}`);
    });

    // Construct the URL
    const cdnUrl = process.env.AWS_CDN_URL;
    if (cdnUrl) {
      return `${cdnUrl}/${objectKey}`;
    } else {
      return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${objectKey}`;
    }
  } catch (error) {
    logger.error(`S3 upload error: ${error.message}`);
    // Fallback to local storage
    return saveLocally(file);
  }
};

/**
 * Save file locally when S3 upload fails
 * @param {Object} file - Express multer file object
 * @returns {Promise<String>} - URL path of the saved file
 */
const saveLocally = async (file) => {
  try {
    // If file is already saved by multer, just return the path
    if (file.path) {
      // Convert backslashes to forward slashes for URL paths
      const relativePath = file.path.replace(/\\/g, '/');
      return `/${relativePath}`;
    }

    // If we need to manually save the file
    const uploadDir = 'uploads';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Create a readable stream from the buffer and pipe to writable file stream
    const readStream = fs.createReadStream(file.path);
    const writeStream = fs.createWriteStream(filePath);
    
    readStream.pipe(writeStream);
    
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        resolve(`/${filePath.replace(/\\/g, '/')}`);
      });
      writeStream.on('error', reject);
    });
  } catch (error) {
    logger.error(`Local file save error: ${error.message}`);
    throw new Error('Failed to save file locally');
  }
};

/**
 * Delete file from S3 bucket
 * @param {String} fileUrl - URL of the file to delete
 * @returns {Promise<Boolean>} - Success status
 */
export const deleteFromS3 = async (fileUrl) => {
  try {
    // Extract key from URL
    let key;
    
    if (process.env.AWS_CDN_URL && fileUrl.startsWith(process.env.AWS_CDN_URL)) {
      key = fileUrl.substring(process.env.AWS_CDN_URL.length + 1);
    } else {
      const s3BucketUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`;
      if (fileUrl.startsWith(s3BucketUrl)) {
        key = fileUrl.substring(s3BucketUrl.length);
      } else {
        // Handle local file
        if (fileUrl.startsWith('/uploads/')) {
          deleteLocally(fileUrl.substring(1)); // Remove leading slash
          return true;
        }
        throw new Error('Invalid file URL');
      }
    }

    // Check if S3 is configured
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.AWS_BUCKET_NAME
    ) {
      logger.warn('AWS S3 not configured, deleting local file');
      deleteLocally(key);
      return true;
    }

    // Delete from S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    
    logger.info(`File deleted from S3: ${key}`);
    return true;
  } catch (error) {
    logger.error(`S3 delete error: ${error.message}`);
    return false;
  }
};

/**
 * Delete file from local storage
 * @param {String} filePath - Path of the file to delete
 */
const deleteLocally = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted locally: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Local file delete error: ${error.message}`);
  }
};

/**
 * Upload file to storage (S3 or local)
 * @param {Object} file - Express multer file object
 * @param {String} folder - Folder to store the file in (optional)
 * @returns {Promise<String>} - URL of the uploaded file
 */
export const uploadFile = async (file, folder = 'uploads') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Generate a key with folder structure
    const fileName = `${Date.now()}-${file.originalname}`;
    const key = `${folder}/${fileName}`;
    
    // Upload to S3 or local storage
    return await uploadToS3(file, key);
  } catch (error) {
    logger.error(`File upload error: ${error.message}`);
    throw error;
  }
};