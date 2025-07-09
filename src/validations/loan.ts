import Joi from 'joi';
import { STATUS } from '../types';

export const createLoanSchema = Joi.object({
  beneficiaryId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required()
    .min(100)
    .max(1000000),
  comment: Joi.string().max(500).optional(),
  purpose: Joi.string().max(200).optional(),
  status: Joi.string().valid(...Object.values(STATUS)).default('PENDING'),
  repaymentPeriod: Joi.string().valid('30days', '60days', '90days', '6months', '1year', '2years', '5years').optional(),
  term: Joi.string().max(100).optional(),
  interestRate: Joi.number().positive().precision(2).min(1).max(30).optional(),
  guaranteed: Joi.boolean().default(false),
  dueDate: Joi.date().iso().greater('now').required(),
  payments: Joi.string().max(1000).optional(),
  paymentId: Joi.string().uuid().optional(),
  cooperativeId: Joi.string().uuid().required()
});

export const updateLoanSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional()
    .min(100)
    .max(1000000),
  comment: Joi.string().max(500).optional(),
  purpose: Joi.string().max(200).optional(),
  status: Joi.string().valid(...Object.values(STATUS)).optional(),
  repaymentPeriod: Joi.string().valid('30days', '60days', '90days', '6months', '1year', '2years', '5years').optional(),
  term: Joi.string().max(100).optional(),
  interestRate: Joi.number().positive().precision(2).min(1).max(30).optional(),
  guaranteed: Joi.boolean().optional(),
  dueDate: Joi.date().iso().greater('now').optional(),
  payments: Joi.string().max(1000).optional(),
  paymentId: Joi.string().uuid().optional(),
  archived: Joi.boolean().optional(),
  deleted: Joi.boolean().optional()
});