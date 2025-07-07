import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createLoanSchema, updateLoanSchema } from '../validations/loan';
import { STATUS } from '../types';
import { Prisma } from '@prisma/client';

// Extend the Loan type to include soft delete fields
type LoanWithSoftDelete = Prisma.LoanGetPayload<{
    include: {
        beneficiary: true;
        cooperative: true;
        Repayment: true;
    };
}> & {
    deleted?: boolean;
    archived?: boolean;
};

const LoanRoutePlugin: Hapi.Plugin<null> = {
    name: 'loanRoutes',
    register: async (server: Hapi.Server) => {
        server.route([
            // Create loan
            {
                method: 'POST',
                path: '/api/v1/loans',
                handler: createLoanHandler,
                options: {
                    validate: {
                        payload: createLoanSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'loan'],
                    description: 'Create a new loan'
                }
            },
            // Get all loans
            {
                method: 'GET',
                path: '/api/v1/loans',
                handler: getAllLoansHandler,
                options: {
                    validate: {
                        query: Joi.object({
                            beneficiaryId: Joi.string().uuid().optional(),
                            cooperativeId: Joi.string().uuid().optional(),
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
                    tags: ['api', 'loan'],
                    description: 'Get all loans with pagination'
                }
            },
            // Get single loan
            {
                method: 'GET',
                path: '/api/v1/loans/{id}',
                handler: getLoanHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'loan'],
                    description: 'Get a loan by ID'
                }
            },
            // Update loan
            {
                method: 'PUT',
                path: '/api/v1/loans/{id}',
                handler: updateLoanHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        payload: updateLoanSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'loan'],
                    description: 'Update a loan by ID'
                }
            },
            // Delete loan (soft delete)
            {
                method: 'DELETE',
                path: '/api/v1/loans/{id}',
                handler: deleteLoanHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'loan'],
                    description: 'Soft delete a loan by ID'
                }
            },
            // Get loan repayments
            {
                method: 'GET',
                path: '/api/v1/loans/{id}/repayments',
                handler: getLoanRepaymentsHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    tags: ['api', 'loan'],
                    description: 'Get all repayments for a loan'
                }
            }
        ]);
    }
};

// Handler functions
const createLoanHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as Omit<Prisma.LoanCreateInput, 'archived' | 'deleted'>;
        const loan = await request.server.app.prisma.loan.create({
            data: {
                ...payload,
                dueDate: new Date(payload.dueDate),
                status: payload.status || 'PENDING',
                // archived and deleted will use their default values from Prisma schema
            },
            include: {
                beneficiary: true,
                cooperative: true
            }
        });

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: loan
        }).code(201);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to create loan',
            details: error.message
        }).code(500);
    }
};

const getAllLoansHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { beneficiaryId, cooperativeId, status, archived, deleted, page, limit } = request.query;
        const where: Prisma.LoanWhereInput = {
            ...(beneficiaryId && { beneficiaryId }),
            ...(cooperativeId && { cooperativeId }),
            ...(status && { status }),
            ...(archived !== undefined && { archived }),
            ...(deleted !== undefined && { deleted })
        };

        const [loans, total] = await Promise.all([
            request.server.app.prisma.loan.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                include: {
                    beneficiary: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    cooperative: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    Repayment: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            request.server.app.prisma.loan.count({ where })
        ]);

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: {
                items: loans,
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to fetch loans',
            details: error.message
        }).code(500);
    }
};

const getLoanHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const loan = await request.server.app.prisma.loan.findUnique({
            where: { id },
            include: {
                beneficiary: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                cooperative: {
                    select: {
                        id: true,
                        name: true,
                        contactPerson: true
                    }
                },
                Repayment: {
                    orderBy: {
                        dueDate: 'asc'
                    }
                }
            }
        }) as LoanWithSoftDelete | null;

        if (!loan || loan.deleted) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Loan not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: loan
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to fetch loan',
            details: error.message
        }).code(500);
    }
};

const updateLoanHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as Omit<Prisma.LoanUpdateInput, 'archived' | 'deleted'>;

        // Check if loan exists and is not deleted
        const existingLoan = await request.server.app.prisma.loan.findUnique({
            where: { id }
        }) as LoanWithSoftDelete | null;

        if (!existingLoan || existingLoan.deleted) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Loan not found'
            }).code(404);
        }

        // Handle date conversion if dueDate is being updated
        if (payload.dueDate) {
            payload.dueDate = new Date(payload.dueDate as string);
        }

        const loan = await request.server.app.prisma.loan.update({
            where: { id },
            data: {
                ...payload,
                updatedAt: new Date()
            },
            include: {
                beneficiary: true,
                cooperative: true
            }
        });

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: loan
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to update loan',
            details: error.message
        }).code(500);
    }
};

const deleteLoanHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        // Check if loan exists
        const existingLoan = await request.server.app.prisma.loan.findUnique({
            where: { id }
        }) as LoanWithSoftDelete | null;

        if (!existingLoan || existingLoan.deleted) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Loan not found'
            }).code(404);
        }

        // Check if there are any repayments
        const repayments = await request.server.app.prisma.repayment.count({
            where: { loanId: id }
        });

        if (repayments > 0) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Cannot delete loan with existing repayments'
            }).code(400);
        }

        // Soft delete by setting deleted flag
        await request.server.app.prisma.loan.update({
            where: { id },
            data: {
                deleted: true,
                updatedAt: new Date()
            } as unknown as Prisma.LoanUpdateInput
        });

        return h.response({
            version: '1.0.0',
            status: 'success',
            message: 'Loan marked as deleted successfully'
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to delete loan',
            details: error.message
        }).code(500);
    }
};

const getLoanRepaymentsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        
        // First verify loan exists
        const loan = await request.server.app.prisma.loan.findUnique({
            where: { id }
        }) as LoanWithSoftDelete | null;

        if (!loan || loan.deleted) {
            return h.response({
                version: '1.0.0',
                status: 'error',
                message: 'Loan not found'
            }).code(404);
        }

        const repayments = await request.server.app.prisma.repayment.findMany({
            where: { loanId: id },
            orderBy: {
                dueDate: 'asc'
            },
            include: {
                User: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return h.response({
            version: '1.0.0',
            status: 'success',
            data: repayments
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            status: 'error',
            message: 'Failed to fetch loan repayments',
            details: error.message
        }).code(500);
    }
};

export default LoanRoutePlugin;