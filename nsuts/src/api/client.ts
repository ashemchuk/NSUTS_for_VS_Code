import createClient, { Middleware } from "openapi-fetch";

import type { paths } from "./api";
import { ExtensionContext } from "vscode";

export const client = createClient<paths>({
    baseUrl: "https://fresh.nsuts.ru/nsuts-new/api/",
});

export function registerAuthMiddleware(context: ExtensionContext) {
    const middleware: Middleware = {
        async onRequest({ request }) {
            const cookie = await context.secrets.get("nsuts.cookie");

            if (cookie) {
                request.headers.set("Cookie", cookie);
            }

            return request;
        },
    };

    client.use(middleware);
}
