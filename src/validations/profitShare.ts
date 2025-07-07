import Joi from 'joi';
import { STATUS } from '../types';

export const createProfitShareSchema = Joi.object({
  period: Joi.date().iso().required(),
  userId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  comment: Joi.string().max(500).optional(),
  status: Joi.string().valid(...Object.values(STATUS)).default('PENDING'),
  cooperativeId: Joi.string().uuid().required()
});

export const updateProfitShareSchema = Joi.object({
  period: Joi.date().iso().optional(),
  amount: Joi.number().positive().precision(2).optional(),
  comment: Joi.string().max(500).optional(),
  status: Joi.string().valid(...Object.values(STATUS)).optional(),
  archived: Joi.boolean().optional(),
  deleted: Joi.boolean().optional()
});