import Joi from 'joi';

export const createPaymentSchema = Joi.object({
    payeeId: Joi.string().uuid().required(),
    payerId: Joi.string().uuid().required(),
    amount: Joi.number().positive().precision(2).required(),
    comment: Joi.string().max(500).optional(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').default('pending'),
    userId: Joi.string().uuid().optional()
});

export const updatePaymentSchema = Joi.object({
    amount: Joi.number().positive().precision(2).optional(),
    comment: Joi.string().max(500).optional(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').optional(),
    userId: Joi.string().uuid().optional()
});