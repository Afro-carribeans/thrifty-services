import Joi from 'joi';

export const createReferralSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    refreeEmail: Joi.string().email().required(),
    status: Joi.string().valid('pending', 'completed', 'expired').default('pending'),
    bonusAmount: Joi.number().positive().precision(2).default(0)
});

export const updateReferralSchema = Joi.object({
    refreeEmail: Joi.string().email().optional(),
    status: Joi.string().valid('pending', 'completed', 'expired').optional(),
    bonusAmount: Joi.number().positive().precision(2).optional()
});