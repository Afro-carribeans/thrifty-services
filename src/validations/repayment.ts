import Joi from 'joi';
import { STATUS } from '../types';

export const createRepaymentSchema = Joi.object({
  payeeId: Joi.string().uuid().required(),
  payerId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  dueDate: Joi.date().iso().greater('now').required(),
  loanId: Joi.string().uuid().optional(),
  status: Joi.string().valid(...Object.values(STATUS)).default('PENDING'),
  payments: Joi.string().max(1000).optional(),
  userId: Joi.string().uuid().optional()
});

export const updateRepaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional(),
  dueDate: Joi.date().iso().greater('now').optional(),
  status: Joi.string().valid(...Object.values(STATUS)).optional(),
  payments: Joi.string().max(1000).optional(),
  userId: Joi.string().uuid().optional(),
  archived: Joi.boolean().optional(),
  deleted: Joi.boolean().optional()
});