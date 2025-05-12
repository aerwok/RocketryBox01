import Joi from 'joi';

const permissionsSchema = Joi.object({
  orders: Joi.object({
    view: Joi.boolean().default(false),
    create: Joi.boolean().default(false),
    update: Joi.boolean().default(false),
    cancel: Joi.boolean().default(false)
  }).default(),
  shipments: Joi.object({
    view: Joi.boolean().default(false),
    create: Joi.boolean().default(false),
    update: Joi.boolean().default(false),
    track: Joi.boolean().default(false)
  }).default(),
  billing: Joi.object({
    view: Joi.boolean().default(false),
    download: Joi.boolean().default(false)
  }).default(),
  settings: Joi.object({
    view: Joi.boolean().default(false),
    update: Joi.boolean().default(false)
  }).default(),
  products: Joi.object({
    view: Joi.boolean().default(false),
    create: Joi.boolean().default(false),
    update: Joi.boolean().default(false),
    delete: Joi.boolean().default(false)
  }).default(),
  support: Joi.object({
    view: Joi.boolean().default(false),
    create: Joi.boolean().default(false),
    respond: Joi.boolean().default(false)
  }).default()
}).default();

export const addTeamUserSchema = Joi.object({
  name: Joi.string()
    .required()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be 10 digits',
      'any.required': 'Phone number is required'
    }),
  role: Joi.string()
    .valid('Admin', 'Manager', 'Staff')
    .default('Staff')
    .messages({
      'any.only': 'Role must be either Admin, Manager, or Staff'
    }),
  permissions: permissionsSchema
});

export const updateTeamUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      'string.pattern.base': 'Phone number must be 10 digits'
    }),
  role: Joi.string()
    .valid('Admin', 'Manager', 'Staff')
    .messages({
      'any.only': 'Role must be either Admin, Manager, or Staff'
    }),
  status: Joi.string()
    .valid('Active', 'Inactive')
    .messages({
      'any.only': 'Status must be either Active or Inactive'
    })
});

export const updatePermissionsSchema = Joi.object({
  permissions: permissionsSchema.required()
}); 