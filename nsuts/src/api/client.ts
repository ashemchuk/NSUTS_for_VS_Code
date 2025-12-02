import createClient, { Middleware } from "openapi-fetch";

import type { paths } from "./api";
import { ExtensionContext } from "vscode";
import { getAuthCookie, getAuthData, getAuthHandler } from "../commands/auth";

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
        async onResponse({ response }) {
            if (response.status === 400) {
                let email = await context.secrets.get("nsuts.email");
                let password = await context.secrets.get("nsuts.password");

                if (!email || !password) {
                    const data = await getAuthData();
                    email = data.email;
                    password = data.password;
                }
                const cookie = await getAuthCookie(email, password);
                await context.secrets.store("nsuts.cookie", cookie);
            }
        },
    };

    client.use(middleware);
}
