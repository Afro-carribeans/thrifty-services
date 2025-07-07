import Joi from 'joi';
import { STATUS } from '../types';

export const createCooperativeSchema = Joi.object({
  name: Joi.string().required().max(100),
  contactPerson: Joi.string().required().max(100),
  status: Joi.string().valid(...Object.values(STATUS)).default('PENDING'),
  verified: Joi.boolean().default(false),
  description: Joi.string().max(500).optional(),
  isPublic: Joi.boolean().default(false),
  creator: Joi.string().uuid().required()
});

export const updateCooperativeSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  contactPerson: Joi.string().max(100).optional(),
  status: Joi.string().valid(...Object.values(STATUS)).optional(),
  verified: Joi.boolean().optional(),
  description: Joi.string().max(500).optional(),
  isPublic: Joi.boolean().optional(),
  archived: Joi.boolean().optional(),
  deleted: Joi.boolean().optional()
});