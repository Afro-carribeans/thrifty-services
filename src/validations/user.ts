import Joi from 'joi';

export const addressSchema = Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    postalCode: Joi.string().optional()
});

export const bankInfoSchema = Joi.object({
    bankName: Joi.string().optional(),
    accountNumber: Joi.string().optional(),
    accountName: Joi.string().optional(),
    iban: Joi.string().optional()
});

export const memberOfSchema = Joi.object({
    cooperativeId: Joi.string().required(),
    role: Joi.string().required(),
    joinedAt: Joi.date().optional()
});

export const createUserSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    password: Joi.string().min(6).required(),
    address: addressSchema.required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    profileImg: Joi.string().optional(),
    memberOf: Joi.array().items(memberOfSchema).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
    verified: Joi.boolean().default(false),
    termAccepted: Joi.boolean().required(),
    authenticatorId: Joi.string().optional(),
    bankInfo: bankInfoSchema.optional()
});

export const updateUserSchema = Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    password: Joi.string().min(6).optional(),
    address: addressSchema.optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    profileImg: Joi.string().optional(),
    memberOf: Joi.array().items(memberOfSchema).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    verified: Joi.boolean().optional(),
    termAccepted: Joi.boolean().optional(),
    authenticatorId: Joi.string().optional(),
    bankInfo: bankInfoSchema.optional()
});