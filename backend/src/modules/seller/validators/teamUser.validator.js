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
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Phone number must be 10 digits'
    }),
  password: Joi.string()
    .required()
    .min(6)
    .max(128)
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required'
    }),
  role: Joi.string()
    .valid('Owner', 'Manager', 'Staff')
    .default('Staff')
    .messages({
      'any.only': 'Role must be either Owner, Manager, or Staff'
    }),
  permissions: permissionsSchema
});

export const updateTeamUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Phone number must be 10 digits'
    }),
  role: Joi.string()
    .valid('Owner', 'Manager', 'Staff')
    .messages({
      'any.only': 'Role must be either Owner, Manager, or Staff'
    }),
  status: Joi.string()
    .valid('Active', 'Inactive', 'Suspended', 'Pending')
    .messages({
      'any.only': 'Status must be either Active, Inactive, Suspended, or Pending'
    }),
  permissions: permissionsSchema
});

export const updatePermissionsSchema = Joi.object({
  permissions: permissionsSchema.required()
});

// Team User Authentication Schemas
export const loginTeamUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});
