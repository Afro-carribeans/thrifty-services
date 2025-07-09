

import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createPaymentSchema, updatePaymentSchema } from '../validations/payment';
import { STATUS } from '../types';
import { Prisma } from '@prisma/client';

// Extend the Payment type to include deleted and archived fields
type PaymentWithSoftDelete = Prisma.PaymentGetPayload<{
    include: {
        User: true;
    };
}> & {
    deleted?: boolean;
    archived?: boolean;
};



const PaymentRoutePlugin: Hapi.Plugin<null> = {
    name: 'paymentRoutes',
    register: async (server: Hapi.Server) => {
        server.route([
            // Create payment
            {
                method: 'POST',
                path: '/api/v1/payments',
                handler: createPaymentHandler,
                options: {
                    validate: {
                        payload: createPaymentSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'payment'],
                    description: 'Create a new payment'
                }
            },
            // Get all payments
            {
                method: 'GET',
                path: '/api/v1/payments',
                handler: getAllPaymentsHandler,
                options: {
                    validate: {
                        query: Joi.object({
                            payeeId: Joi.string().uuid().optional(),
                            payerId: Joi.string().uuid().optional(),
                            status: Joi.string().valid(...Object.values(STATUS)).optional(),
                            archived: Joi.boolean().optional(),
                            deleted: Joi.boolean().optional(),
                            page: Joi.number().integer().min(1).default(1),
                            limit: Joi.number().integer().min(1).max(100).default(10)
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'payment'],
                    description: 'Get all payments with pagination'
                }
            },
            // Get single payment
            {
                method: 'GET',
                path: '/api/v1/payments/{id}',
                handler: getPaymentHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'payment'],
                    description: 'Get a payment by ID'
                }
            },
            // Update payment
            {
                method: 'PUT',
                path: '/api/v1/payments/{id}',
                handler: updatePaymentHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        payload: updatePaymentSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'payment'],
                    description: 'Update a payment by ID'
                }
            },
            // Delete payment (soft delete)
            {
                method: 'DELETE',
                path: '/api/v1/payments/{id}',
                handler: deletePaymentHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'payment'],
                    description: 'Soft delete a payment by ID'
                }
            }
        ]);
    }
};


// Handler functions
const createPaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as Omit<Prisma.PaymentCreateInput, 'archived' | 'deleted'>;
        const payment = await request.server.app.prisma.payment.create({
            data: {
                ...payload,
                status: payload.status || 'PENDING',
            },
            include: {
                User: true
            }
        });

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: payment
        }).code(201);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to create payment',
            details: error.message
        }).code(500);
    }
};

const getAllPaymentsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { payeeId, payerId, status, archived, deleted, page, limit } = request.query;
        const where: Prisma.PaymentWhereInput = {
            ...(payeeId && { payeeId }),
            ...(payerId && { payerId }),
            ...(status && { status }),
            ...(archived !== undefined && { archived }),
            ...(deleted !== undefined && { deleted })
        };

        const [payments, total] = await Promise.all([
            request.server.app.prisma.payment.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                include: {
                    User: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            request.server.app.prisma.payment.count({ where })
        ]);

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: {
                items: payments,
                meta: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to fetch payments',
            details: error.message
        }).code(500);
    }
};

const getPaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payment = await request.server.app.prisma.payment.findUnique({
            where: { id },
            include: {
                User: true
            }
        }) as PaymentWithSoftDelete | null;

        if (!payment || payment.deleted) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Payment not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: payment
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to fetch payment',
            details: error.message
        }).code(500);
    }
};

const updatePaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as Omit<Prisma.PaymentUpdateInput, 'archived' | 'deleted'>;

        // Check if payment exists and is not deleted
        const existingPayment = await request.server.app.prisma.payment.findUnique({
            where: { id }
        }) as PaymentWithSoftDelete | null;

        if (!existingPayment || existingPayment.deleted) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Payment not found'
            }).code(404);
        }

        const payment = await request.server.app.prisma.payment.update({
            where: { id },
            data: {
                ...payload,
                updatedAt: new Date()
            },
            include: {
                User: true
            }
        });

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: payment
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to update payment',
            details: error.message
        }).code(500);
    }
};

const deletePaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        // Check if payment exists
        const existingPayment = await request.server.app.prisma.payment.findUnique({
            where: { id }
        }) as PaymentWithSoftDelete | null;

        if (!existingPayment || existingPayment.deleted) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Payment not found'
            }).code(404);
        }

        // Soft delete using type assertion
        await request.server.app.prisma.payment.update({
            where: { id },
            data: {
                deleted: true,
                updatedAt: new Date()
            } as unknown as Prisma.PaymentUpdateInput
        });

        return h.response({
            version: '1.0.0',
            status: 'success',
            message: 'Payment marked as deleted successfully'
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to delete payment',
            details: error.message
        }).code(500);
    }
};

export default PaymentRoutePlugin;