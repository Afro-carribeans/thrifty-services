import Hapi from '@hapi/hapi';

import * as dotenv from 'dotenv';

dotenv.config();

type TemplateFuncType = any;

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        templateName: TemplateFuncType;
    }
}

const TemplateRoutePlugin: Hapi.Plugin<null> = {
    name: 'templateName',
    dependencies: ['dependencies'],
    register: async (server: Hapi.Server) => {
        server.route([
            {
                method: ['POST', 'PUT'],
                path: '/api/v1/templateRouteName',
                handler: templateRouteHandler,
                options: {
                    auth: false,
                },
            },
        ]);
    },
};

const templateRouteHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const {} = request.payload;
    try {
        return h
            .response({
                version: '1.0.0',
                data: {},
            })
            .code(200);
    } catch (error: any) {
        return h
            .response({
                version: '1.0.0',
                error: error.message,
            })
            .code(500);
    }
};

export default TemplateRoutePlugin;
