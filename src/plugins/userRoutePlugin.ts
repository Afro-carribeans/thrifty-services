import Hapi from '@hapi/hapi';
import Joi from 'joi';
import { createUserSchema, updateUserSchema, addressSchema, bankInfoSchema, memberOfSchema } from '../validations/user';
import { PrismaClient } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from '../types/user';
import { ROLES, STATUS } from '../types'; // Import from your types file

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
                            role: Joi.string().valid(...Object.values(ROLES)).optional(),
                            status: Joi.string().valid(...Object.values(STATUS)).optional()
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
        const payload = request.payload as CreateUserDto;
        
        // Create base user data without archived/deleted
        const userData = {
            ...payload,
            address: JSON.stringify(payload.address),
            memberOf: payload.memberOf ? JSON.stringify(payload.memberOf) : '[]',
            bankInfo: payload.bankInfo ? JSON.stringify(payload.bankInfo) : '{}',
            status: payload.status || 'PENDING',
            verified: payload.verified || false
        };

        // Add archived/deleted only if they exist in the schema
        const finalData = {
            ...userData,
            ...('archived' in request.server.app.prisma.user.fields ? { archived: false } : {}),
            ...('deleted' in request.server.app.prisma.user.fields ? { deleted: false } : {})
        };

        const user = await request.server.app.prisma.user.create({
            data: finalData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
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
        const { page, limit, role, status } = request.query as {
            page: number;
            limit: number;
            role?: string;
            status?: string;
        };

        // Build where clause dynamically based on schema
        const where: any = {};
        if ('deleted' in request.server.app.prisma.user.fields) {
            where.deleted = false;
        }
        if (role) where.role = role;
        if (status) where.status = status;

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
                    phone: true,
                    role: true,
                    status: true,
                    verified: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
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
        console.error(error);
        return h.response({
            status: 'error',
            message: 'Internal server error'
        }).code(500);
    }
};

const getUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        
        // First get the user without deleted check
        const user = await request.server.app.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImg: true,
                role: true,
                status: true,
                verified: true,
                termAccepted: true,
                createdAt: true,
                updatedAt: true,
                address: true,
                bankInfo: true,
                memberOf: true,
                ...('deleted' in request.server.app.prisma.user.fields ? { deleted: true } : {})
            }
        });

        // Then check if user exists and is not deleted (if deleted field exists)
        if (!user || ('deleted' in request.server.app.prisma.user.fields && user.deleted)) {
            return h.response({
                status: 'error',
                message: 'User not found'
            }).code(404);
        }

        // Parse JSON fields
        const parsedUser = {
            ...user,
            address: user.address ? JSON.parse(user.address as string) : {},
            bankInfo: user.bankInfo ? JSON.parse(user.bankInfo as string) : {},
            memberOf: user.memberOf ? JSON.parse(user.memberOf as string) : []
        };

        return h.response({
            status: 'success',
            data: parsedUser
        });
    } catch (error) {
        console.error(error);
        return h.response({
            status: 'error',
            message: 'Internal server error'
        }).code(500);
    }
};

const updateUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        const payload = request.payload as UpdateUserDto;

        const updateData: any = { ...payload };
        
        if (payload.address) {
            updateData.address = JSON.stringify(payload.address);
        }
        if (payload.bankInfo) {
            updateData.bankInfo = JSON.stringify(payload.bankInfo);
        }
        if (payload.memberOf) {
            updateData.memberOf = JSON.stringify(payload.memberOf);
        }

        const user = await request.server.app.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                verified: true,
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
        console.error(error);
        return h.response({
            status: 'error',
            message: 'Internal server error'
        }).code(500);
    }
};

const deleteUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
        const { id } = request.params;
        
        // First check if user exists
        const userExists = await request.server.app.prisma.user.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!userExists) {
            return h.response({
                status: 'error',
                message: 'User not found'
            }).code(404);
        }

        // Prepare update data
        const updateData: any = {
            status: 'DEACTIVATED'
        };

        // Check if fields exist in the schema before adding them
        const userFields = request.server.app.prisma.user.fields;
        if ('deleted' in userFields) {
            updateData.deleted = true;
        }
        if ('archived' in userFields) {
            updateData.archived = true;
        }

        // Perform the update
        await request.server.app.prisma.user.update({
            where: { id },
            data: updateData
        });

        return h.response({
            status: 'success',
            message: 'User deactivated successfully'
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return h.response({
                status: 'error',
                message: 'User not found'
            }).code(404);
        }
        console.error(error);
        return h.response({
            status: 'error',
            message: 'Internal server error'
        }).code(500);
    }
};

export default UserRoutePlugin;