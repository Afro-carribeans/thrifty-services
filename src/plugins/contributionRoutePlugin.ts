import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createContributionSchema, updateContributionSchema } from '../validations/contribution';

const ContributionRoutePlugin: Hapi.Plugin<null> = {
    name: 'contributionRoutes',
    register: async (server: Hapi.Server) => {
        server.route([
            // Create contribution
            {
                method: 'POST',
                path: '/api/v1/contributions',
                handler: createContributionHandler,
                options: {
                    validate: {
                        payload: createContributionSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    }
                }
            },
            // Get all contributions
            {
                method: 'GET',
                path: '/api/v1/contributions',
                handler: getAllContributionsHandler,
                options: {
                    validate: {
                        query: Joi.object({
                            userId: Joi.string().uuid().optional(),
                            cooperativeId: Joi.string().uuid().optional(),
                            status: Joi.string().valid('PENDING', 'COMPLETED', 'SENT', 'PAID', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'APPROVED').optional(),
                            isActive: Joi.boolean().optional(),
                            archived: Joi.boolean().optional(),
                            page: Joi.number().integer().min(1).default(1),
                            limit: Joi.number().integer().min(1).max(100).default(10)
                        }),
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    }
                }
            },
            // Get single contribution
            {
                method: 'GET',
                path: '/api/v1/contributions/{id}',
                handler: getContributionHandler,
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
            // Update contribution
            {
                method: 'PUT',
                path: '/api/v1/contributions/{id}',
                handler: updateContributionHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        payload: updateContributionSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    }
                }
            },
            // Delete contribution (soft delete)
            {
                method: 'DELETE',
                path: '/api/v1/contributions/{id}',
                handler: deleteContributionHandler,
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
const createContributionHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as any;
        const contribution = await request.server.app.prisma.contribution.create({
            data: {
                ...payload,
                archived: false,
                deleted: false
            }
        });

        return h.response({
            version: '1.0.0',
            data: contribution
        }).code(201);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getAllContributionsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { userId, cooperativeId, status, isActive, archived, page, limit } = request.query;
        
        const where: any = {
            ...(userId && { userId }),
            ...(cooperativeId && { cooperativeId }),
            ...(status && { status }),
            ...(isActive !== undefined && { isActive }),
            ...(archived !== undefined && { archived })
        };

        const [contributions, total] = await Promise.all([
            request.server.app.prisma.contribution.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
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
            }),
            request.server.app.prisma.contribution.count({ where })
        ]);

        return h.response({
            version: '1.0.0',
            data: {
                items: contributions,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getContributionHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const contribution = await request.server.app.prisma.contribution.findUnique({
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

        if (!contribution) {
            return h.response({
                version: '1.0.0',
                error: 'Contribution not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            data: contribution
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const updateContributionHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as any;

        // Ensure we don't update deleted contributions
        const existing = await request.server.app.prisma.contribution.findUnique({
            where: { id }
        });

        if (!existing) {
            return h.response({
                version: '1.0.0',
                error: 'Contribution not found'
            }).code(404);
        }

        const contribution = await request.server.app.prisma.contribution.update({
            where: { id },
            data: payload
        });

        return h.response({
            version: '1.0.0',
            data: contribution
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const deleteContributionHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        // Soft delete instead of hard delete
        await request.server.app.prisma.contribution.update({
            where: { id },
            data: {
                isActive: false,
                // Ensure the archived property exists in the Prisma schema or remove it if unnecessary
                
            }
        });

        return h.response({
            version: '1.0.0',
            message: 'Contribution deleted successfully'
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

export default ContributionRoutePlugin;