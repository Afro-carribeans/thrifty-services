import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createPaymentSchema, updatePaymentSchema } from '../validations/payment';

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
                    }
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
                            status: Joi.string().optional(),
                            page: Joi.number().integer().min(1).default(1),
                            limit: Joi.number().integer().min(1).max(100).default(10)
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    }
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
                    }
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
                    }
                }
            },
            // Delete payment
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
                    }
                }
            }
        ]);
    }
};

// Handler functions
const createPaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as any;
        const payment = await request.server.app.prisma.payment.create({
            data: {
                ...payload,
                status: payload.status || 'pending' // Default status
            }
        });

        return h.response({
            version: '1.0.0',
            data: payment
        }).code(201);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getAllPaymentsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { payeeId, payerId, status, page, limit } = request.query;
        
        const where = {
            ...(payeeId && { payeeId }),
            ...(payerId && { payerId }),
            ...(status && { status })
        };

        const [payments, total] = await Promise.all([
            request.server.app.prisma.payment.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    User: true
                }
            }),
            request.server.app.prisma.payment.count({ where })
        ]);

        return h.response({
            version: '1.0.0',
            data: {
                payments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
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
        });

        if (!payment) {
            return h.response({
                version: '1.0.0',
                error: 'Payment not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            data: payment
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const updatePaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as any;

        const payment = await request.server.app.prisma.payment.update({
            where: { id },
            data: payload
        });

        return h.response({
            version: '1.0.0',
            data: payment
        }).code(200);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return h.response({
                version: '1.0.0',
                error: 'Payment not found'
            }).code(404);
        }
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const deletePaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        await request.server.app.prisma.payment.delete({
            where: { id }
        });

        return h.response({
            version: '1.0.0',
            message: 'Payment deleted successfully'
        }).code(200);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return h.response({
                version: '1.0.0',
                error: 'Payment not found'
            }).code(404);
        }
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

export default PaymentRoutePlugin;