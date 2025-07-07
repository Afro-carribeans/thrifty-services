import Hapi from '@hapi/hapi';
import * as Jwt from '@hapi/jwt';

const AuthPlugin: Hapi.Plugin<null> = {
    name: 'auth',
    register: async (server: Hapi.Server) => {
        await server.register(Jwt);

        server.auth.strategy('jwt', 'jwt', {
            keys: process.env.JWT_SECRET || 'your_default_secret_key',
            verify: {
                aud: false,
                iss: false,
                sub: false,
                nbf: true,
                exp: true,
                maxAgeSec: 14400 // 4 hours
            },
            validate: (artifacts: any) => ({
                isValid: true,
                credentials: { 
                    userId: artifacts.decoded.payload.userId,
                    scope: artifacts.decoded.payload.scope 
                }
            })
        });

        // Set default auth strategy if you want
        server.auth.default('jwt');
    }
};

export default AuthPlugin;