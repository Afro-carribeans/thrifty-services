import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createProfitShareSchema, updateProfitShareSchema } from '../validations/profitShare';

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
                    }
                }
            },
            // Delete profit share
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
const createProfitShareHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as any;
        const profitShare = await request.server.app.prisma.profitShare.create({
            data: payload,
            include: {
                user: true,
                cooperative: true
            }
        });

        return h.response({
            version: '1.0.0',
            data: profitShare
        }).code(201);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getAllProfitSharesHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { userId, cooperativeId, status, page, limit } = request.query;
        const where = {
            ...(userId && { userId }),
            ...(cooperativeId && { cooperativeId }),
            ...(status && { status })
        };

        const [profitShares, total] = await Promise.all([
            request.server.app.prisma.profitShare.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: true,
                    cooperative: true
                }
            }),
            request.server.app.prisma.profitShare.count({ where })
        ]);

        return h.response({
            version: '1.0.0',
            data: {
                items: profitShares,
                total,
                page,
                limit
            }
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getProfitShareHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const profitShare = await request.server.app.prisma.profitShare.findUnique({
            where: { id },
            include: {
                user: true,
                cooperative: true
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
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const updateProfitShareHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as any;

        const profitShare = await request.server.app.prisma.profitShare.update({
            where: { id },
            data: payload,
            include: {
                user: true,
                cooperative: true
            }
        });

        return h.response({
            version: '1.0.0',
            data: profitShare
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const deleteProfitShareHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        await request.server.app.prisma.profitShare.delete({
            where: { id }
        });

        return h.response({
            version: '1.0.0',
            message: 'Profit share deleted successfully'
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getCooperativeProfitSharesHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { cooperativeId } = request.params;
        const { page = 1, limit = 10 } = request.query;

        const [profitShares, total] = await Promise.all([
            request.server.app.prisma.profitShare.findMany({
                where: { cooperativeId },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: true
                }
            }),
            request.server.app.prisma.profitShare.count({ where: { cooperativeId } })
        ]);

        return h.response({
            version: '1.0.0',
            data: {
                items: profitShares,
                total,
                page,
                limit
            }
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

export default ProfitShareRoutePlugin;