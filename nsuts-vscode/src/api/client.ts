import createClient, { Middleware, Client } from "openapi-fetch";
import type { paths } from "./api";
import { ExtensionContext } from "vscode";
import { getAuthCookie } from "../commands/auth";
import { getBaseUrl } from "../config";

/**
 * Create an API client with the given base URL and optional middleware.
 */
function createApiClient(
    baseUrl: string,
    context?: ExtensionContext
): Client<paths> {
    const client = createClient<paths>({ baseUrl });

    if (context) {
        const middleware: Middleware = {
            async onRequest({ request }) {
                // Derive storage key from baseUrl host
                const host = new URL(baseUrl).host;
                const cookieKey = `nsuts.cookie.${host}`;
                const cookie = await context.secrets.get(cookieKey);

                if (cookie) {
                    request.headers.set("Cookie", cookie);
                }

                return request;
            },
            async onResponse({ response }) {
                if (400 <= response.status && response.status < 500) {
                    const host = new URL(baseUrl).host;
                    const emailKey = `nsuts.email.${host}`;
                    const passwordKey = `nsuts.password.${host}`;
                    const cookieKey = `nsuts.cookie.${host}`;

                    let email = await context.secrets.get(emailKey);
                    let password = await context.secrets.get(passwordKey);

                    if (!email || !password) {
                        // Fallback to legacy keys for backward compatibility
                        email = await context.secrets.get("nsuts.email");
                        password = await context.secrets.get("nsuts.password");
                    }

                    if (!email || !password) {
                        return response;
                    }

                    try {
                        const cookie = await getAuthCookie(email, password);
                        await context.secrets.store(cookieKey, cookie);
                        // TODO: authorized retry
                    } catch (error) {
                        // Ignore re-auth failures
                    }
                }
            },
        };
        client.use(middleware);
    }

    return client;
}

/**
 * Global client instance (lazy) for the current baseUrl.
 * Use `getClient` to get a client with the current configuration.
 */
let globalClient: Client<paths> | null = null;
let globalContext: ExtensionContext | null = null;
let lastBaseUrl: string | null = null;

export function getClient(context?: ExtensionContext): Client<paths> {
    const baseUrl = getBaseUrl();
    if (!globalClient || globalContext !== context || lastBaseUrl !== baseUrl) {
        globalClient = createApiClient(baseUrl, context);
        globalContext = context || null;
        lastBaseUrl = baseUrl;
    }
    return globalClient;
}

/**
 * @deprecated Use `getClient()` instead. Use getClient() to get proper client instance.
 */
export const client = createApiClient(getBaseUrl());

/**
 * Register auth middleware for the global client (legacy).
 * This is called from extension activation.
 */
export function registerAuthMiddleware(context: ExtensionContext) {
    // This ensures the global client uses the provided context.
    globalContext = context;
    globalClient = createApiClient(getBaseUrl(), context);
}
