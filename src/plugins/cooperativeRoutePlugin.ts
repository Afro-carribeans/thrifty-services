import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createCooperativeSchema, updateCooperativeSchema } from '../validations/cooperative';
import { STATUS } from '../types';

const CooperativeRoutePlugin: Hapi.Plugin<null> = {
    name: 'cooperativeRoutes',
    register: async (server: Hapi.Server) => {
        server.route([
            // Create cooperative
            {
                method: 'POST',
                path: '/api/v1/cooperatives',
                handler: createCooperativeHandler,
                options: {
                    validate: {
                        payload: createCooperativeSchema,
                        failAction: (request, h, err) => { throw err; }
                    }
                }
            },
            // Get all cooperatives
            {
                method: 'GET',
                path: '/api/v1/cooperatives',
                handler: getAllCooperativesHandler,
                options: {
                    validate: {
                        query: Joi.object({
                            isPublic: Joi.boolean().optional(),
                            verified: Joi.boolean().optional(),
                            status: Joi.string().valid(...Object.values(STATUS)).optional(),
                            page: Joi.number().integer().min(1).default(1),
                            limit: Joi.number().integer().min(1).max(100).default(10),
                            includeArchived: Joi.boolean().default(false),
                            includeDeleted: Joi.boolean().default(false)
                        })
                    }
                }
            },
            // Get single cooperative
            {
                method: 'GET',
                path: '/api/v1/cooperatives/{id}',
                handler: getCooperativeHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        query: Joi.object({
                            includeArchived: Joi.boolean().default(false),
                            includeDeleted: Joi.boolean().default(false)
                        })
                    }
                }
            },
            // Update cooperative
            {
                method: 'PUT',
                path: '/api/v1/cooperatives/{id}',
                handler: updateCooperativeHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        payload: updateCooperativeSchema
                    }
                }
            },
            // Delete cooperative (soft delete)
            {
                method: 'DELETE',
                path: '/api/v1/cooperatives/{id}',
                handler: deleteCooperativeHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        })
                    }
                }
            },
            // Get cooperative members
            {
                method: 'GET',
                path: '/api/v1/cooperatives/{id}/members',
                handler: getCooperativeMembersHandler,
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
const createCooperativeHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as any;
        const cooperative = await request.server.app.prisma.cooperative.create({
            data: {
                ...payload,
                isPublic: payload.inPublic // Map to database field
            }
        });

        return h.response({
            version: '1.0.0',
            data: cooperative
        }).code(201);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getAllCooperativesHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { isPublic, verified, status, page, limit, includeArchived, includeDeleted } = request.query;
        
        const where = {
            ...(isPublic !== undefined && { inPublic: isPublic }),
            ...(verified !== undefined && { verified }),
            ...(status !== undefined && { status }),
            ...(!includeArchived && { archived: false }),
            ...(!includeDeleted && { deleted: false })
        };

        const cooperatives = await request.server.app.prisma.cooperative.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                ProfitShare: true,
                Contribution: true,
                Loan: true
            }
        });

        return h.response({
            version: '1.0.0',
            data: cooperatives
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getCooperativeHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const { includeArchived, includeDeleted } = request.query;

        const where = {
            id,
            ...(!includeArchived && { archived: false }),
            ...(!includeDeleted && { deleted: false })
        };

        const cooperative = await request.server.app.prisma.cooperative.findUnique({
            where,
            include: {
                ProfitShare: true,
                Contribution: true,
                Loan: true
            }
        });

        if (!cooperative) {
            return h.response({
                version: '1.0.0',
                error: 'Cooperative not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            data: cooperative
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const updateCooperativeHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as any;

        // Map isPublic to inPublic if provided
        if (payload.isPublic !== undefined) {
            payload.inPublic = payload.isPublic;
            delete payload.isPublic;
        }

        const cooperative = await request.server.app.prisma.cooperative.update({
            where: { id },
            data: payload
        });

        return h.response({
            version: '1.0.0',
            data: cooperative
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const deleteCooperativeHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        // Soft delete instead of hard delete
        await request.server.app.prisma.cooperative.update({
            where: { id },
        data: { 
         //   deleted: true 
        }
        });

        return h.response({
            version: '1.0.0',
            message: 'Cooperative marked as deleted'
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getCooperativeMembersHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        
        const members = await request.server.app.prisma.user.findMany({
            where: {
                memberOf: {
                    path: ['$[*].cooperativeId'],
                    array_contains: id
                },
               // deleted: false // Only non-deleted members
            }
        });

        return h.response({
            version: '1.0.0',
            data: members
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

export default CooperativeRoutePlugin;