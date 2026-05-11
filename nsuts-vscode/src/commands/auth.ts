import * as vscode from "vscode";

import { getClient } from "../api/client";
import { getBaseUrl } from "../config";
import { PathsLoginPostRequestBodyApplicationJsonMethod } from "../api/api";

function getSecretKeysForCurrentHost() {
    const host = new URL(getBaseUrl()).host;
    return {
        emailKey: `nsuts.email.${host}`,
        passwordKey: `nsuts.password.${host}`,
        cookieKey: `nsuts.cookie.${host}`,
    };
}

export async function getAuthCookie(
    email: string,
    password: string,
    context?: vscode.ExtensionContext
): Promise<string> {
    const client = getClient(context);
    const { response, error } = await client.POST("/login", {
        body: {
            email,
            password,
            method: PathsLoginPostRequestBodyApplicationJsonMethod.internal,
        },
    });

    if (error) {
        const err = error as any;
        throw new Error(
            `Authentication failed: ${err.error || err.status || err.message || 'Unknown error'}`
        );
    }

    if (!response.ok) {
        throw new Error(`Authentication failed with status ${response.status}`);
    }

    const setCookie = response.headers.getSetCookie();
    const cookie = setCookie?.at(0);

    if (!cookie) {
        throw new Error(
            "Login or password is not correct (no cookie received)"
        );
    }

    return cookie;
}

export function getAuthHandler(context: vscode.ExtensionContext) {
    return async function () {
        const { email, password } = await getAuthData();

        const cookie = await getAuthCookie(email, password, context);
        const { emailKey, passwordKey, cookieKey } =
            getSecretKeysForCurrentHost();

        await context.secrets.store(emailKey, email);
        await context.secrets.store(passwordKey, password);
        await context.secrets.store(cookieKey, cookie);

        vscode.window.showInformationMessage(
            "Authorization completed successful!"
        );
        await vscode.commands.executeCommand(
            "setContext",
            "nsuts.authorized",
            true
        );
        await vscode.commands.executeCommand("nsuts.refresh_task_tree");
    };
}

export async function getAuthData() {
    const email = await vscode.window.showInputBox({
        prompt: "Your email",
        ignoreFocusOut: true,
    });
    const password = await vscode.window.showInputBox({
        prompt: "Your password",
        password: true,
        ignoreFocusOut: true,
    });

    if (!email || !password) {
        vscode.window.showErrorMessage("Email or password is not entered!");
        throw new Error("Email or password weren't enter");
    }
    return { email, password };
}
