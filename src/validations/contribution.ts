import Joi from 'joi';
import { STATUS } from '../types';

export const createContributionSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  isActive: Joi.boolean().default(true),
  cooperativeId: Joi.string().uuid().required(),
  frequency: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly', 'one-time').required(),
  status: Joi.string().valid(...Object.values(STATUS)).default('PENDING'),
  paymentId: Joi.string().uuid().optional(),
  paymentMethod: Joi.string().max(50).optional()
});

export const updateContributionSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional(),
  isActive: Joi.boolean().optional(),
  frequency: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly', 'one-time').optional(),
  status: Joi.string().valid(...Object.values(STATUS)).optional(),
  paymentId: Joi.string().uuid().optional(),
  paymentMethod: Joi.string().max(50).optional(),
  archived: Joi.boolean().optional(),
  deleted: Joi.boolean().optional()
});