import Joi from 'joi';

export const createContributionSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    amount: Joi.number().positive().precision(2).required(),
    isActive: Joi.boolean().default(true),
    cooperativeId: Joi.string().uuid().required(),
    frequency: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly', 'one-time').required(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'processing').default('pending'),
    paymentId: Joi.string().uuid().optional(),
    paymentMethod: Joi.string().max(50).optional()
});

export const updateContributionSchema = Joi.object({
    amount: Joi.number().positive().precision(2).optional(),
    isActive: Joi.boolean().optional(),
    frequency: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly', 'one-time').optional(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'processing').optional(),
    paymentId: Joi.string().uuid().optional(),
    paymentMethod: Joi.string().max(50).optional()
});