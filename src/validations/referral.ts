import Joi from 'joi';
import { STATUS } from '../types';

export const createReferralSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  refreeEmail: Joi.string().email().required(),
  status: Joi.string().valid(...Object.values(STATUS)).default('PENDING'),
  bonusAmount: Joi.number().positive().precision(2).default(0)
});

export const updateReferralSchema = Joi.object({
  refreeEmail: Joi.string().email().optional(),
  status: Joi.string().valid(...Object.values(STATUS)).optional(),
  bonusAmount: Joi.number().positive().precision(2).optional(),
  archived: Joi.boolean().optional(),
  deleted: Joi.boolean().optional()
});