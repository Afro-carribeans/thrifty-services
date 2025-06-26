import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createReferralSchema, updateReferralSchema } from '../validations/referral';

const ReferralRoutePlugin: Hapi.Plugin<null> = {
    name: 'referralRoutes',
    register: async (server: Hapi.Server) => {
        server.route([
            // Create referral
            {
                method: 'POST',
                path: '/api/v1/referrals',
                handler: createReferralHandler,
                options: {
                    validate: {
                        payload: createReferralSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    }
                }
            },
            // Get all referrals
            {
                method: 'GET',
                path: '/api/v1/referrals',
                handler: getAllReferralsHandler,
                options: {
                    validate: {
                        query: Joi.object({
                            userId: Joi.string().uuid().optional(),
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
            // Get single referral
            {
                method: 'GET',
                path: '/api/v1/referrals/{id}',
                handler: getReferralHandler,
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
            // Update referral
            {
                method: 'PUT',
                path: '/api/v1/referrals/{id}',
                handler: updateReferralHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        payload: updateReferralSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    }
                }
            },
            // Delete referral
            {
                method: 'DELETE',
                path: '/api/v1/referrals/{id}',
                handler: deleteReferralHandler,
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
            // Get user referrals
            {
                method: 'GET',
                path: '/api/v1/users/{userId}/referrals',
                handler: getUserReferralsHandler,
                options: {
                    validate: {
                        params: Joi.object({
                            userId: Joi.string().uuid().required()
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
const createReferralHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as any;
        const referral = await request.server.app.prisma.referral.create({
            data: {
                userId: payload.userId,
                refreeEmail: payload.refreeEmail,
                status: payload.status || 'pending',
                bonusAmount: payload.bonusAmount || 0,
                user: { connect: { id: payload.userId } }
            }
        });

        return h.response({
            version: '1.0.0',
            data: referral
        }).code(201);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getAllReferralsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { userId, status, page, limit } = request.query;
        const where: any = {};
        
        if (userId) where.userId = userId;
        if (status) where.status = status;

        const [referrals, total] = await Promise.all([
            request.server.app.prisma.referral.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            }),
            request.server.app.prisma.referral.count({ where })
        ]);

        return h.response({
            version: '1.0.0',
            data: {
                referrals,
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

const getReferralHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const referral = await request.server.app.prisma.referral.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        if (!referral) {
            return h.response({
                version: '1.0.0',
                error: 'Referral not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            data: referral
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const updateReferralHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as any;

        const referral = await request.server.app.prisma.referral.update({
            where: { id },
            data: payload
        });

        return h.response({
            version: '1.0.0',
            data: referral
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const deleteReferralHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        await request.server.app.prisma.referral.delete({
            where: { id }
        });

        return h.response({
            version: '1.0.0',
            message: 'Referral deleted successfully'
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getUserReferralsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { userId } = request.params;
        const { page = 1, limit = 10 } = request.query;

        const [referrals, total] = await Promise.all([
            request.server.app.prisma.referral.findMany({
                where: { userId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            request.server.app.prisma.referral.count({ where: { userId } })
        ]);

        return h.response({
            version: '1.0.0',
            data: {
                referrals,
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

export default ReferralRoutePlugin;