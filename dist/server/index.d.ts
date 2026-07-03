/// <reference types="node" />
import 'dotenv/config';
declare const app: import("express-serve-static-core").Express;
declare const server: import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>;
export { app, server };
//# sourceMappingURL=index.d.ts.map