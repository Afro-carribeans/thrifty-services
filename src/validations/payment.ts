import Joi from 'joi';
import { STATUS } from '../types';

export const createPaymentSchema = Joi.object({
  payeeId: Joi.string().uuid().required(),
  payerId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  comment: Joi.string().max(500).optional(),
  status: Joi.string().valid(...Object.values(STATUS)).default('PENDING'),
  userId: Joi.string().uuid().optional()
});

export const updatePaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional(),
  comment: Joi.string().max(500).optional(),
  status: Joi.string().valid(...Object.values(STATUS)).optional(),
  userId: Joi.string().uuid().optional(),
  archived: Joi.boolean().optional(),
  deleted: Joi.boolean().optional()
});