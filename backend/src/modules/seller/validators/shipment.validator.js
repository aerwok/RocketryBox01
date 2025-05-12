import Joi from 'joi';

export const createShipmentSchema = Joi.object({
  orderId: Joi.string().required(),
  courier: Joi.string().required(),
  awb: Joi.string().required(),
  pickupDate: Joi.date().optional()
});

export const createBulkShipmentsSchema = Joi.object({
  shipments: Joi.array().items(
    Joi.object({
      orderId: Joi.string().required(),
      courier: Joi.string().required(),
      awb: Joi.string().required(),
      pickupDate: Joi.date().optional()
    })
  ).min(1).required()
});

export const updateShipmentStatusSchema = Joi.object({
  status: Joi.string().required(),
  description: Joi.string().allow('', null),
  location: Joi.string().allow('', null)
});

export const addTrackingEventSchema = Joi.object({
  status: Joi.string().required(),
  description: Joi.string().allow('', null),
  location: Joi.string().allow('', null)
});

export const handleReturnSchema = Joi.object({
  status: Joi.string().valid('Returned', 'NDR').required(),
  description: Joi.string().allow('', null)
});

// Middleware
import { validateRequest } from '../../../middleware/validator.js';

export const validateCreateShipment = validateRequest(createShipmentSchema);
export const validateCreateBulkShipments = validateRequest(createBulkShipmentsSchema);
export const validateUpdateShipmentStatus = validateRequest(updateShipmentStatusSchema);
export const validateAddTrackingEvent = validateRequest(addTrackingEventSchema);
export const validateHandleReturn = validateRequest(handleReturnSchema); 