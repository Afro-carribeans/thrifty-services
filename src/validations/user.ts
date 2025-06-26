import Joi from 'joi';
import { UserRole } from '../types/user';

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
    cooperativeId: Joi.string().uuid().required(),
    role: Joi.string().required(),
    joinedAt: Joi.date().optional()
});

export const createUserSchema = Joi.object({
    firstName: Joi.string().required().max(100),
    lastName: Joi.string().required().max(100),
    password: Joi.string().min(8).required(),
    address: addressSchema.required(),
    email: Joi.string().email().required().max(255),
    phone: Joi.string().required().max(20),
    profileImg: Joi.string().uri().optional(),
    memberOf: Joi.array().items(memberOfSchema).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
    verified: Joi.boolean().default(false),
    termAccepted: Joi.boolean().required(),
    authenticatorId: Joi.string().optional(),
    bankInfo: bankInfoSchema.optional(),
    role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.USER)
});

export const updateUserSchema = Joi.object({
    firstName: Joi.string().max(100).optional(),
    lastName: Joi.string().max(100).optional(),
    password: Joi.string().min(8).optional(),
    address: addressSchema.optional(),
    email: Joi.string().email().max(255).optional(),
    phone: Joi.string().max(20).optional(),
    profileImg: Joi.string().uri().optional(),
    memberOf: Joi.array().items(memberOfSchema).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    verified: Joi.boolean().optional(),
    termAccepted: Joi.boolean().optional(),
    authenticatorId: Joi.string().optional(),
    bankInfo: bankInfoSchema.optional(),
    role: Joi.string().valid(...Object.values(UserRole)).optional()
});