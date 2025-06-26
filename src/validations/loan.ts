import Joi from 'joi';

export const createLoanSchema = Joi.object({
    beneficiaryId: Joi.string().uuid().required(),
    amount: Joi.number().positive().precision(2).required()
        .min(100) // Minimum loan amount
        .max(1000000), // Maximum loan amount
    comment: Joi.string().max(500).optional(),
    purpose: Joi.string().max(200).optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'disbursed', 'paid', 'defaulted')
        .default('pending'),
    repaymentPeriod: Joi.string().valid('30days', '60days', '90days', '6months', '1year', '2years', '5years'),
    term: Joi.string().max(100).optional(),
    interestRate: Joi.number().positive().precision(2).min(1).max(30).optional(), // 1-30% interest
    guaranteed: Joi.boolean().default(false),
    dueDate: Joi.date().iso().greater('now').required(), // Must be in the future
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
    status: Joi.string().valid('pending', 'approved', 'rejected', 'disbursed', 'paid', 'defaulted').optional(),
    repaymentPeriod: Joi.string().valid('30days', '60days', '90days', '6months', '1year', '2years', '5years').optional(),
    term: Joi.string().max(100).optional(),
    interestRate: Joi.number().positive().precision(2).min(1).max(30).optional(),
    guaranteed: Joi.boolean().optional(),
    dueDate: Joi.date().iso().greater('now').optional(),
    payments: Joi.string().max(1000).optional(),
    paymentId: Joi.string().uuid().optional()
});