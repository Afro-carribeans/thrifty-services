import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createRepaymentSchema, updateRepaymentSchema } from '../validations/repayment';

const RepaymentRoutePlugin: Hapi.Plugin<null> = {
    name: 'repaymentRoutes',
    register: async (server: Hapi.Server) => {
        server.route([
            // Create repayment
            {
                method: 'POST',
                path: '/api/v1/repayments',
                handler: createRepaymentHandler,
                options: {
                    validate: {
                        payload: createRepaymentSchema
                    }
                }
            },
            // Get all repayments
            {
                method: 'GET',
                path: '/api/v1/repayments',
                handler: getAllRepaymentsHandler,
                options: {
                    validate: {
                        query: Joi.object({
                            payeeId: Joi.string().uuid().optional(),
                            payerId: Joi.string().uuid().optional(),
                            loanId: Joi.string().uuid().optional(),
                            status: Joi.string().optional(),
                            page: Joi.number().integer().min(1).default(1),
                            limit: Joi.number().integer().min(1).max(100).default(10)
                        })
                    }
                }
            },
            // Get single repayment
            {
                method: 'GET',
                path: '/api/v1/repayments/{id}',
                handler: getRepaymentHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        })
                    }
                }
            },
            // Update repayment
            {
                method: 'PUT',
                path: '/api/v1/repayments/{id}',
                handler: updateRepaymentHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        payload: updateRepaymentSchema
                    }
                }
            },
            // Delete repayment
            {
                method: 'DELETE',
                path: '/api/v1/repayments/{id}',
                handler: deleteRepaymentHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        })
                    }
                }
            }
        ]);
    }
};

// Handler functions
const createRepaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as any;
        const repayment = await request.server.app.prisma.repayment.create({
            data: {
                ...payload,
                dueDate: new Date(payload.dueDate) // Ensure proper date conversion
            }
        });

        return h.response({
            version: '1.0.0',
            data: repayment
        }).code(201);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getAllRepaymentsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { payeeId, payerId, loanId, status, page, limit } = request.query;
        const where = {
            ...(payeeId && { payeeId }),
            ...(payerId && { payerId }),
            ...(loanId && { loanId }),
            ...(status && { status })
        };

        const [repayments, total] = await Promise.all([
            request.server.app.prisma.repayment.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    loan: true,
                    User: true
                },
                orderBy: {
                    dueDate: 'asc'
                }
            }),
            request.server.app.prisma.repayment.count({ where })
        ]);

        return h.response({
            version: '1.0.0',
            data: {
                repayments,
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

const getRepaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const repayment = await request.server.app.prisma.repayment.findUnique({
            where: { id },
            include: {
                loan: true,
                User: true
            }
        });

        if (!repayment) {
            return h.response({
                version: '1.0.0',
                error: 'Repayment not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            data: repayment
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const updateRepaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as any;

        // Convert dueDate to Date object if provided
        if (payload.dueDate) {
            payload.dueDate = new Date(payload.dueDate);
        }

        const repayment = await request.server.app.prisma.repayment.update({
            where: { id },
            data: payload
        });

        return h.response({
            version: '1.0.0',
            data: repayment
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const deleteRepaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        await request.server.app.prisma.repayment.delete({
            where: { id }
        });

        return h.response({
            version: '1.0.0',
            message: 'Repayment deleted successfully'
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

export default RepaymentRoutePlugin;