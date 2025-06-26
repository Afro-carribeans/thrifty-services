import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { PrismaClient } from '@prisma/client';
import { createUserSchema, updateUserSchema } from '../validations/user';

const prisma = new PrismaClient();

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        prisma: PrismaClient;
    }
}

const UserRoutePlugin: Hapi.Plugin<null> = {
    name: 'userRoutes',
    register: async (server: Hapi.Server) => {
        // Store prisma client in server app for access in handlers
        server.app.prisma = prisma;

        server.route([
            // Create user
            {
                method: 'POST',
                path: '/api/v1/users',
                handler: createUserHandler,
                options: {
                    auth: false,
                    validate: {
                        payload: createUserSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    }
                }
            },
            // Get all users
            {
                method: 'GET',
                path: '/api/v1/users',
                handler: getAllUsersHandler,
                options: {
                    auth: false
                }
            },
            // Get single user
            {
                method: 'GET',
                path: '/api/v1/users/{id}',
                handler: getUserHandler,
                options: {
                    auth: false,
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
            // Update user
            {
                method: 'PUT',
                path: '/api/v1/users/{id}',
                handler: updateUserHandler,
                options: {
                    auth: false,
                    validate: {
                        params: Joi.object({
                            id: Joi.string().uuid().required()
                        }),
                        payload: updateUserSchema,
                        failAction: (request, h, err) => {
                            throw err;
                        }
                    }
                }
            },
            // Delete user
            {
                method: 'DELETE',
                path: '/api/v1/users/{id}',
                handler: deleteUserHandler,
                options: {
                    auth: false,
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
const createUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const payload = request.payload as any;
        const user = await request.server.app.prisma.user.create({
            data: payload
        });

        return h.response({
            version: '1.0.0',
            data: user
        }).code(201);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getAllUsersHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const users = await request.server.app.prisma.user.findMany({
            include: {
                groups: true,
                contributions: true,
                loans: true,
                payments: true,
                repayments: true,
                Referral: true,
                ProfitShare: true
            }
        });

        return h.response({
            version: '1.0.0',
            data: users
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const getUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const user = await request.server.app.prisma.user.findUnique({
            where: { id },
            include: {
                groups: true,
                contributions: true,
                loans: true,
                payments: true,
                repayments: true,
                Referral: true,
                ProfitShare: true
            }
        });

        if (!user) {
            return h.response({
                version: '1.0.0',
                error: 'User not found'
            }).code(404);
        }

        return h.response({
            version: '1.0.0',
            data: user
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const updateUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as any;

        const user = await request.server.app.prisma.user.update({
            where: { id },
            data: payload
        });

        return h.response({
            version: '1.0.0',
            data: user
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

const deleteUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;

        await request.server.app.prisma.user.delete({
            where: { id }
        });

        return h.response({
            version: '1.0.0',
            message: 'User deleted successfully'
        }).code(200);
    } catch (error: any) {
        return h.response({
            version: '1.0.0',
            error: error.message
        }).code(500);
    }
};

export default UserRoutePlugin;