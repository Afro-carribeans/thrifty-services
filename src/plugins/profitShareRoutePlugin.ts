import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createProfitShareSchema, updateProfitShareSchema } from '../validations/profitShare';
import { STATUS } from '../types';
import { Prisma } from '@prisma/client';

const ProfitShareRoutePlugin: Hapi.Plugin<null> = {
    name: 'profitShareRoutes',
    register: async (server: Hapi.Server) => {
        server.route([
            // Create profit share
            {
                method: 'POST',
                path: '/api/v1/profit-shares',
                handler: createProfitShareHandler,
                options: {
                    validate: {
                        payload: createProfitShareSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    auth: {
                        strategy: 'jwt',
                        scope: ['COOP_ADMIN', 'ADMIN']
                    }
                }
            },
            // Get all profit shares
            {
                method: 'GET',
                path: '/api/v1/profit-shares',
                handler: getAllProfitSharesHandler,
                options: {
                    validate: {
                        query: Joi.object({
                            userId: Joi.string().uuid().optional(),
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
                    auth: {
                        strategy: 'jwt',
                        scope: ['COOP_ADMIN', 'ADMIN', 'COOP_MEMBER']
                    }
                }
            },
            // Get single profit share
            {
                method: 'GET',
                path: '/api/v1/profit-shares/{id}',
                handler: getProfitShareHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    auth: {
                        strategy: 'jwt',
                        scope: ['COOP_ADMIN', 'ADMIN', 'COOP_MEMBER']
                    }
                }
            },
            // Update profit share
            {
                method: 'PUT',
                path: '/api/v1/profit-shares/{id}',
                handler: updateProfitShareHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        payload: updateProfitShareSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    auth: {
                        strategy: 'jwt',
                        scope: ['COOP_ADMIN', 'ADMIN']
                    }
                }
            },
            // Soft delete profit share
            {
                method: 'DELETE',
                path: '/api/v1/profit-shares/{id}',
                handler: deleteProfitShareHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    auth: {
                        strategy: 'jwt',
                        scope: ['COOP_ADMIN', 'ADMIN']
                    }
                }
            },
            // Get cooperative profit shares
            {
                method: 'GET',
                path: '/api/v1/cooperatives/{cooperativeId}/profit-shares',
                handler: getCooperativeProfitSharesHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            cooperativeId: Joi.string().uuid().required()
                        }),
                        query: Joi.object({
                            archived: Joi.boolean().optional(),
                            deleted: Joi.boolean().optional(),
                            page: Joi.number().integer().min(1).default(1),
                            limit: Joi.number().integer().min(1).max(100).default(10)
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    },
                    auth: {
                        strategy: 'jwt',
                        scope: ['COOP_ADMIN', 'ADMIN', 'COOP_MEMBER']
                    }
                }
            }
        ]);
    }
};

// Handler functions
const createProfitShareHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as Omit<Prisma.ProfitShareCreateInput, 'archived' | 'deleted'>;
        const profitShare = await request.server.app.prisma.$transaction(async (prisma) => {
            return await prisma.profitShare.create({
                data: {
                    ...payload,
                    status: payload.status || 'PENDING'
                },
                include: {
                    user: {
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
                            name: true,
                            contactPerson: true
                        }
                    }
                }
            });
        });

        return h.response({
            version: '1.0.0',
            data: profitShare
        }).code(201);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            error: 'Failed to create profit share'
        }).code(500);
    }
};

const getAllProfitSharesHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { userId, cooperativeId, status, archived, deleted, page, limit } = request.query;
        const where: Prisma.ProfitShareWhereInput = {};

        if (userId) where.userId = userId;
        if (cooperativeId) where.cooperativeId = cooperativeId;
        if (status) where.status = status;
        if (archived !== undefined) (where as any).archived = archived;
        if (deleted !== undefined) (where as any).deleted = deleted;

        const [profitShares, total] = await request.server.app.prisma.$transaction([
            request.server.app.prisma.profitShare.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                include: {
                    user: {
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
                            name: true,
                            contactPerson: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            request.server.app.prisma.profitShare.count({ where })
        ]);

        return h.response({
            version: '1.0.0',
            data: {
                items: profitShares,
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
            error: 'Failed to fetch profit shares'
        }).code(500);
    }
};

const getProfitShareHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const profitShare = await request.server.app.prisma.profitShare.findUnique({
            where: { id },
            include: {
                user: {
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
                        name: true,
                        contactPerson: true
                    }
                }
            }
        });

        if (!profitShare) {
            return h.response({
                version: '1.0.0',
                error: 'Profit share not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            data: profitShare
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            error: 'Failed to fetch profit share'
        }).code(500);
    }
};

const updateProfitShareHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as Omit<Prisma.ProfitShareUpdateInput, 'archived' | 'deleted'>;

        const profitShare = await request.server.app.prisma.$transaction(async (prisma) => {
            return await prisma.profitShare.update({
                where: { id },
                data: {
                    ...payload,
                    updatedAt: new Date()
                },
                include: {
                    user: {
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
                            name: true,
                            contactPerson: true
                        }
                    }
                }
            });
        });

        return h.response({
            version: '1.0.0',
            data: profitShare
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            error: 'Failed to update profit share'
        }).code(500);
    }
};

const deleteProfitShareHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        // Soft delete by setting deleted flag
        await request.server.app.prisma.$transaction(async (prisma) => {
            await prisma.profitShare.update({
                where: { id },
                data: {
                    deleted: true,
                    updatedAt: new Date()
                } as unknown as Prisma.ProfitShareUpdateInput
            });
        });

        return h.response({
            version: '1.0.0',
            message: 'Profit share marked as deleted successfully'
        }).code(200);
    } catch (error: any) {
        request.log('error', error);
        return h.response({
            version: '1.0.0',
            error: 'Failed to delete profit share'
        }).code(500);
    }
};

const getCooperativeProfitSharesHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { cooperativeId } = request.params;
        const { archived, deleted, page, limit } = request.query;

        const where: Prisma.ProfitShareWhereInput = {
            cooperativeId,
            ...(archived !== undefined && { archived: archived as boolean }),
            ...(deleted !== undefined && { deleted: deleted as boolean })
        };

        const [profitShares, total] = await request.server.app.prisma.$transaction([
            request.server.app.prisma.profitShare.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            request.server.app.prisma.profitShare.count({ where })
        ]);

        return h.response({
            version: '1.0.0',
            data: {
                items: profitShares,
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
            error: 'Failed to fetch cooperative profit shares'
        }).code(500);
    }
};

export default ProfitShareRoutePlugin;