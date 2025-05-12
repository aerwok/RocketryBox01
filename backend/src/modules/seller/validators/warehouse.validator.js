import Joi from 'joi';

export const addStockSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
  location: Joi.string().required(),
  notes: Joi.string().allow('', null)
}); 