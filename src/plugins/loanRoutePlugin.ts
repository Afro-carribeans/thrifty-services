import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createLoanSchema, updateLoanSchema } from '../validations/loan';

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
                    }
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
                    }
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
                    }
                }
            },
            // Delete loan
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
                    }
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
                    }
                }
            }
        ]);
    }
};

// Handler functions
const createLoanHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as any;
        const loan = await request.server.app.prisma.loan.create({
            data: {
                ...payload,
                dueDate: new Date(payload.dueDate) // Ensure proper date format
            },
            include: {
                beneficiary: true,
                cooperative: true
            }
        });

        return h.response({
            version: '1.0.0',
            data: loan
        }).code(201);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getAllLoansHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { beneficiaryId, cooperativeId, status, page, limit } = request.query;
        
        const where = {
            ...(beneficiaryId && { beneficiaryId }),
            ...(cooperativeId && { cooperativeId }),
            ...(status && { status })
        };

        const [loans, total] = await Promise.all([
            request.server.app.prisma.loan.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
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
            data: {
                loans,
                meta: {
                    total,
                    page,
                    limit,
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
        });

        if (!loan) {
            return h.response({
                version: '1.0.0',
                error: 'Loan not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            data: loan
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const updateLoanHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as any;

        // Handle date conversion if dueDate is being updated
        if (payload.dueDate) {
            payload.dueDate = new Date(payload.dueDate);
        }

        const loan = await request.server.app.prisma.loan.update({
            where: { id },
            data: payload,
            include: {
                beneficiary: true,
                cooperative: true
            }
        });

        return h.response({
            version: '1.0.0',
            data: loan
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const deleteLoanHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        // First check if there are any repayments
        const repayments = await request.server.app.prisma.repayment.count({
            where: { loanId: id }
        });

        if (repayments > 0) {
            return h.response({
                version: '1.0.0',
                error: 'Cannot delete loan with existing repayments'
            }).code(400);
        }

        await request.server.app.prisma.loan.delete({
            where: { id }
        });

        return h.response({
            version: '1.0.0',
            message: 'Loan deleted successfully'
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getLoanRepaymentsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        
        // First verify loan exists
        const loan = await request.server.app.prisma.loan.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!loan) {
            return h.response({
                version: '1.0.0',
                error: 'Loan not found'
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
            data: repayments
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

export default LoanRoutePlugin;