import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createRepaymentSchema, updateRepaymentSchema } from '../validations/repayment';
import { STATUS } from '../types';
import { Prisma } from '@prisma/client';

// Extend the Repayment type to include deleted and archived fields
type RepaymentWithSoftDelete = Prisma.RepaymentGetPayload<{
    include: {
        loan: true;
        User: true;
    };
}> & {
    deleted?: boolean;
    archived?: boolean;
};

const RepaymentRoutePlugin: Hapi.Plugin<null> = {
    name: 'repaymentRoutes',
    register: async (server: Hapi.Server) => {
        // Note: The JWT auth strategy should be registered at server level before this plugin
        
        server.route([
            // Create repayment
            {
                method: 'POST',
                path: '/api/v1/repayments',
                handler: createRepaymentHandler,
                options: {
                    auth: 'jwt', // Requires valid JWT token
                    validate: { // JOI validation
                        payload: createRepaymentSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'repayment'],
                    description: 'Create a new repayment'
                }
            },
            // Other routes remain the same...
            // Get all repayments
            {
                method: 'GET',
                path: '/api/v1/repayments',
                handler: getAllRepaymentsHandler,
                options: {
                    auth: 'jwt',
                    validate: {
                        query: Joi.object({
                            payeeId: Joi.string().uuid().optional(),
                            payerId: Joi.string().uuid().optional(),
                            loanId: Joi.string().uuid().optional(),
                            status: Joi.string().valid(...Object.values(STATUS)).optional(),
                            page: Joi.number().integer().min(1).default(1),
                            limit: Joi.number().integer().min(1).max(100).default(10),
                            archived: Joi.boolean().optional(),
                            deleted: Joi.boolean().optional()
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'repayment'],
                    description: 'Get all repayments with pagination'
                }
            },
         
        ]);
    }
};

// Handler functions
const createRepaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as Omit<Prisma.RepaymentCreateInput, 'archived' | 'deleted' | 'createdAt' | 'updatedAt'>;
        const repayment = await request.server.app.prisma.repayment.create({
            data: {
                ...payload,
                dueDate: new Date(payload.dueDate),
                status: payload.status || 'PENDING',
            },
            include: {
                loan: true,
                User: true
            }
        });

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: repayment
        }).code(201);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to create repayment',
            details: error.message
        }).code(500);
    }
};

const getAllRepaymentsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { payeeId, payerId, loanId, status, page, limit, archived, deleted } = request.query;
        const where: Prisma.RepaymentWhereInput = {
            ...(payeeId && { payeeId }),
            ...(payerId && { payerId }),
            ...(loanId && { loanId }),
            ...(status && { status }),
            ...(archived !== undefined && { archived }),
            ...(deleted !== undefined && { deleted })
        };

        const [repayments, total] = await Promise.all([
            request.server.app.prisma.repayment.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
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
            status: 'success',
            data: {
                items: repayments,
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
            message: 'Failed to fetch repayments',
            details: error.message
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
        }) as RepaymentWithSoftDelete | null;

        if (!repayment || repayment.deleted) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Repayment not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: repayment
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to fetch repayment',
            details: error.message
        }).code(500);
    }
};

const updateRepaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as Omit<Prisma.RepaymentUpdateInput, 'archived' | 'deleted'>;

        // Check if repayment exists and is not deleted
        const existingRepayment = await request.server.app.prisma.repayment.findUnique({
            where: { id }
        }) as RepaymentWithSoftDelete | null;

        if (!existingRepayment || existingRepayment.deleted) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Repayment not found'
            }).code(404);
        }

        // Convert dueDate to Date object if provided
        if (payload.dueDate) {
            payload.dueDate = new Date(payload.dueDate as string);
        }

        const repayment = await request.server.app.prisma.repayment.update({
            where: { id },
            data: {
                ...payload,
                updatedAt: new Date()
            },
            include: {
                loan: true,
                User: true
            }
        });

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: repayment
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to update repayment',
            details: error.message
        }).code(500);
    }
};

const deleteRepaymentHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        // Check if repayment exists
        const existingRepayment = await request.server.app.prisma.repayment.findUnique({
            where: { id }
        }) as RepaymentWithSoftDelete | null;

        if (!existingRepayment || existingRepayment.deleted) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Repayment not found'
            }).code(404);
        }

        // Soft delete using type assertion
        await request.server.app.prisma.repayment.update({
            where: { id },
            data: {
                deleted: true,
                archived: true,
                updatedAt: new Date()
            } as unknown as Prisma.RepaymentUpdateInput
        });

        return h.response({
            version: '1.0.0',
            status: 'success',
            message: 'Repayment deleted successfully'
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to delete repayment',
            details: error.message
        }).code(500);
    }
};

export default RepaymentRoutePlugin;