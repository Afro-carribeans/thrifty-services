import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createUserSchema, updateUserSchema } from '../validations/user';
import { PrismaClient } from '@prisma/client';

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        prisma: PrismaClient;
    }
}

const UserRoutePlugin: Hapi.Plugin<null> = {
    name: 'userRoutes',
    register: async (server: Hapi.Server) => {
        server.route([
            {
                method: 'POST',
                path: '/api/v1/users',
                handler: createUserHandler,
                options: {
                    auth: false,
                    validate: {
                        payload: createUserSchema,
                        failAction: 'error'
                    }
                }
            },
            {
                method: 'GET',
                path: '/api/v1/users',
                handler: getAllUsersHandler,
                options: {
                    auth: false,
                    validate: {
                        query: Joi.object({
                            page: Joi.number().integer().min(1).default(1),
                            limit: Joi.number().integer().min(1).max(100).default(10),
                            role: Joi.string().optional(),
                            status: Joi.string().optional()
                        }),
                        failAction: 'error'
                    }
                }
            },
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
                        failAction: 'error'
                    }
                }
            },
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
                        failAction: 'error'
                    }
                }
            },
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
                        failAction: 'error'
                    }
                }
            }
        ]);
    }
};

const createUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const user = await request.server.app.prisma.user.create({
            data: request.payload as any,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true
            }
        });

        return h.response({
            status: 'success',
            data: user
        }).code(201);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return h.response({
                status: 'error',
                message: 'Email already exists'
            }).code(409);
        }
        return h.response({
            status: 'error',
            message: 'Internal server error'
        }).code(500);
    }
};

const getAllUsersHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { page, limit, role, status } = request.query;
        const where = {
            ...(role && { role }),
            ...(status && { status })
        };

        const [users, total] = await Promise.all([
            request.server.app.prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    createdAt: true
                }
            }),
            request.server.app.prisma.user.count({ where })
        ]);

        return h.response({
            status: 'success',
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        return h.response({
            status: 'error',
            message: 'Internal server error'
        }).code(500);
    }
};

const getUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const user = await request.server.app.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                profileImg: true,
                role: true,
                status: true,
                verified: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return h.response({
                status: 'error',
                message: 'User not found'
            }).code(404);
        }

        return h.response({
            status: 'success',
            data: user
        });
    } catch (error) {
        return h.response({
            status: 'error',
            message: 'Internal server error'
        }).code(500);
    }
};

const updateUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const user = await request.server.app.prisma.user.update({
            where: { id },
            data: request.payload as any,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                updatedAt: true
            }
        });

        return h.response({
            status: 'success',
            data: user
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return h.response({
                status: 'error',
                message: 'User not found'
            }).code(404);
        }
        return h.response({
            status: 'error',
            message: 'Internal server error'
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
            status: 'success',
            message: 'User deleted successfully'
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return h.response({
                status: 'error',
                message: 'User not found'
            }).code(404);
        }
        return h.response({
            status: 'error',
            message: 'Internal server error'
        }).code(500);
    }
};

export default UserRoutePlugin;