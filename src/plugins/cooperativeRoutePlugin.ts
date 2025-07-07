import type Hapi from "@hapi/hapi"
import Joi from "joi"
import { createCooperativeSchema, updateCooperativeSchema } from "../validations/cooperative"
import { STATUS } from "../types"

const CooperativeRoutePlugin: Hapi.Plugin<null> = {
  name: "cooperativeRoutes",
  register: async (server: Hapi.Server) => {
    server.route([
      // Create cooperative
      {
        method: "POST",
        path: "/api/v1/cooperatives",
        handler: createCooperativeHandler,
        options: {
          validate: {
            payload: createCooperativeSchema,
            failAction: (request, h, err) => {
              throw err
            },
          },
        },
      },
      // Get all cooperatives
      {
        method: "GET",
        path: "/api/v1/cooperatives",
        handler: getAllCooperativesHandler,
        options: {
          validate: {
            query: Joi.object({
              isPublic: Joi.boolean().optional(),
              verified: Joi.boolean().optional(),
              status: Joi.string()
                .valid(...Object.values(STATUS))
                .optional(),
              page: Joi.number().integer().min(1).default(1),
              limit: Joi.number().integer().min(1).max(100).default(10),
              includeArchived: Joi.boolean().default(false),
              includeDeleted: Joi.boolean().default(false),
            }),
          },
        },
      },
      // Get single cooperative
      {
        method: "GET",
        path: "/api/v1/cooperatives/{id}",
        handler: getCooperativeHandler,
        options: {
          validate: {
            params: Joi.object({
              id: Joi.string().uuid().required(),
            }),
            query: Joi.object({
              includeArchived: Joi.boolean().default(false),
              includeDeleted: Joi.boolean().default(false),
            }),
          },
        },
      },
      // Update cooperative
      {
        method: "PUT",
        path: "/api/v1/cooperatives/{id}",
        handler: updateCooperativeHandler,
        options: {
          validate: {
            params: Joi.object({
              id: Joi.string().uuid().required(),
            }),
            payload: updateCooperativeSchema,
          },
        },
      },
      // Delete cooperative (soft delete)
      {
        method: "DELETE",
        path: "/api/v1/cooperatives/{id}",
        handler: deleteCooperativeHandler,
        options: {
          validate: {
            params: Joi.object({
              id: Joi.string().uuid().required(),
            }),
          },
        },
      },
      // Get cooperative members
      {
        method: "GET",
        path: "/api/v1/cooperatives/{id}/members",
        handler: getCooperativeMembersHandler,
        options: {
          validate: {
            params: Joi.object({
              id: Joi.string().uuid().required(),
            }),
            query: Joi.object({
              page: Joi.number().integer().min(1).default(1),
              limit: Joi.number().integer().min(1).max(100).default(10),
              includeArchived: Joi.boolean().default(false),
            }),
          },
        },
      },
      // Get cooperative contributions
      {
        method: "GET",
        path: "/api/v1/cooperatives/{id}/contributions",
        handler: getCooperativeContributionsHandler,
        options: {
          validate: {
            params: Joi.object({
              id: Joi.string().uuid().required(),
            }),
            query: Joi.object({
              page: Joi.number().integer().min(1).default(1),
              limit: Joi.number().integer().min(1).max(100).default(10),
              status: Joi.string()
                .valid(...Object.values(STATUS))
                .optional(),
            }),
          },
        },
      },
      // Get cooperative loans
      {
        method: "GET",
        path: "/api/v1/cooperatives/{id}/loans",
        handler: getCooperativeLoansHandler,
        options: {
          validate: {
            params: Joi.object({
              id: Joi.string().uuid().required(),
            }),
            query: Joi.object({
              page: Joi.number().integer().min(1).default(1),
              limit: Joi.number().integer().min(1).max(100).default(10),
              status: Joi.string()
                .valid(...Object.values(STATUS))
                .optional(),
            }),
          },
        },
      },
    ])
  },
}

// Handler functions
const createCooperativeHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
  try {
    const payload = request.payload as any

    // Map isPublic to the database field name (isPublic maps to inPublic in schema)
    const cooperativeData = {
      ...payload,
    }

    const cooperative = await request.server.app.prisma.cooperative.create({
      data: cooperativeData,
      include: {
        ProfitShare: true,
        Contribution: true,
        Loan: true,
      },
    })

    return h
      .response({
        version: "1.0.0",
        data: cooperative,
        message: "Cooperative created successfully",
      })
      .code(201)
  } catch (error: any) {
    console.error("Create cooperative error:", error)

    if (error.code === "P2002") {
      return h
        .response({
          version: "1.0.0",
          error: "A cooperative with this information already exists",
        })
        .code(409)
    }

    return h
      .response({
        version: "1.0.0",
        error: "Failed to create cooperative",
      })
      .code(500)
  }
}

const getAllCooperativesHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
  try {
    const { isPublic, verified, status, page, limit, includeArchived, includeDeleted } = request.query

    const where: any = {}

    if (isPublic !== undefined) {
      where.isPublic = isPublic
    }
    if (verified !== undefined) {
      where.verified = verified
    }
    if (status !== undefined) {
      where.status = status
    }
    if (!includeArchived) {
      where.archived = false
    }
    if (!includeDeleted) {
      where.deleted = false
    }

    const [cooperatives, total] = await Promise.all([
      request.server.app.prisma.cooperative.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          ProfitShare: {
            where: { deleted: false },
          },
          Contribution: {
            where: { deleted: false },
          },
          Loan: {
            where: { deleted: false },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      request.server.app.prisma.cooperative.count({ where }),
    ])

    return h
      .response({
        version: "1.0.0",
        data: cooperatives,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
      .code(200)
  } catch (error: any) {
    console.error("Get cooperatives error:", error)
    return h
      .response({
        version: "1.0.0",
        error: "Failed to fetch cooperatives",
      })
      .code(500)
  }
}

const getCooperativeHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
  try {
    const { id } = request.params
    const { includeArchived, includeDeleted } = request.query

    const where: any = { id }

    if (!includeArchived) {
      where.archived = false
    }
    if (!includeDeleted) {
      where.deleted = false
    }

    const cooperative = await request.server.app.prisma.cooperative.findFirst({
      where,
      include: {
        ProfitShare: {
          where: { deleted: false },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        Contribution: {
          where: { deleted: false },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        Loan: {
          where: { deleted: false },
          include: {
            beneficiary: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!cooperative) {
      return h
        .response({
          version: "1.0.0",
          error: "Cooperative not found",
        })
        .code(404)
    }

    return h
      .response({
        version: "1.0.0",
        data: cooperative,
      })
      .code(200)
  } catch (error: any) {
    console.error("Get cooperative error:", error)
    return h
      .response({
        version: "1.0.0",
        error: "Failed to fetch cooperative",
      })
      .code(500)
  }
}

const updateCooperativeHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
  try {
    const { id } = request.params
    const payload = request.payload as any

    // Check if cooperative exists and is not deleted
    const existingCooperative = await request.server.app.prisma.cooperative.findFirst({
      where: {
        id,
        deleted: false,
      },
    })

    if (!existingCooperative) {
      return h
        .response({
          version: "1.0.0",
          error: "Cooperative not found",
        })
        .code(404)
    }

    const cooperative = await request.server.app.prisma.cooperative.update({
      where: { id },
      data: {
        ...payload,
        updatedAt: new Date(),
      },
      include: {
        ProfitShare: true,
        Contribution: true,
        Loan: true,
      },
    })

    return h
      .response({
        version: "1.0.0",
        data: cooperative,
        message: "Cooperative updated successfully",
      })
      .code(200)
  } catch (error: any) {
    console.error("Update cooperative error:", error)

    if (error.code === "P2025") {
      return h
        .response({
          version: "1.0.0",
          error: "Cooperative not found",
        })
        .code(404)
    }

    return h
      .response({
        version: "1.0.0",
        error: "Failed to update cooperative",
      })
      .code(500)
  }
}

const deleteCooperativeHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
  try {
    const { id } = request.params

    // Check if cooperative exists and is not already deleted
    const existingCooperative = await request.server.app.prisma.cooperative.findFirst({
      where: {
        id,
        deleted: false,
      },
    })

    if (!existingCooperative) {
      return h
        .response({
          version: "1.0.0",
          error: "Cooperative not found",
        })
        .code(404)
    }

    // Soft delete the cooperative
    await request.server.app.prisma.cooperative.update({
      where: { id },
      data: {
        deleted: true,
        updatedAt: new Date(),
      },
    })

    return h
      .response({
        version: "1.0.0",
        message: "Cooperative deleted successfully",
      })
      .code(200)
  } catch (error: any) {
    console.error("Delete cooperative error:", error)
    return h
      .response({
        version: "1.0.0",
        error: "Failed to delete cooperative",
      })
      .code(500)
  }
}

const getCooperativeMembersHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
  try {
    const { id } = request.params
    const { page, limit, includeArchived } = request.query

    // First verify the cooperative exists
    const cooperative = await request.server.app.prisma.cooperative.findFirst({
      where: {
        id,
        deleted: false,
      },
    })

    if (!cooperative) {
      return h
        .response({
          version: "1.0.0",
          error: "Cooperative not found",
        })
        .code(404)
    }

    // Get members through contributions (active members)
    const contributions = await request.server.app.prisma.contribution.findMany({
      where: {
        cooperativeId: id,
        deleted: false,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            verified: true,
            createdAt: true,
            archived: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Extract unique users
    const memberMap = new Map()
    contributions.forEach((contribution) => {
      if (contribution.user && (!contribution.user.archived || includeArchived)) {
        memberMap.set(contribution.user.id, contribution.user)
      }
    })

    const members = Array.from(memberMap.values())
    const total = memberMap.size

    return h
      .response({
        version: "1.0.0",
        data: members,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
      .code(200)
  } catch (error: any) {
    console.error("Get cooperative members error:", error)
    return h
      .response({
        version: "1.0.0",
        error: "Failed to fetch cooperative members",
      })
      .code(500)
  }
}

const getCooperativeContributionsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
  try {
    const { id } = request.params
    const { page, limit, status } = request.query

    const where: any = {
      cooperativeId: id,
      deleted: false,
    }

    if (status) {
      where.status = status
    }

    const [contributions, total] = await Promise.all([
      request.server.app.prisma.contribution.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      request.server.app.prisma.contribution.count({ where }),
    ])

    return h
      .response({
        version: "1.0.0",
        data: contributions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
      .code(200)
  } catch (error: any) {
    console.error("Get cooperative contributions error:", error)
    return h
      .response({
        version: "1.0.0",
        error: "Failed to fetch cooperative contributions",
      })
      .code(500)
  }
}

const getCooperativeLoansHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
  try {
    const { id } = request.params
    const { page, limit, status } = request.query

    const where: any = {
      cooperativeId: id,
      deleted: false,
    }

    if (status) {
      where.status = status
    }

    const [loans, total] = await Promise.all([
      request.server.app.prisma.loan.findMany({
        where,
        include: {
          beneficiary: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          Repayment: {
            where: { deleted: false },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      request.server.app.prisma.loan.count({ where }),
    ])

    return h
      .response({
        version: "1.0.0",
        data: loans,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
      .code(200)
  } catch (error: any) {
    console.error("Get cooperative loans error:", error)
    return h
      .response({
        version: "1.0.0",
        error: "Failed to fetch cooperative loans",
      })
      .code(500)
  }
}

export default CooperativeRoutePlugin
