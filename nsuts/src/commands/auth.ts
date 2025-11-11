import * as vscode from "vscode";

import { client } from "../api/client";

async function getAuthCookie(email: string, password: string): Promise<string> {
    const { response } = await client.POST("/login", {
        body: {
            email,
            password,
            method: "internal",
        },
    });

    const cookie = response.headers.getSetCookie().at(0);

    if (!cookie) {
        throw new Error("Auth cookie not found in server response");
    }

    return cookie;
}

export function getAuthHandler(context: vscode.ExtensionContext) {
    return async function () {
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
            return;
        }

        const cookie = await getAuthCookie(email, password);

        await context.secrets.store("nsuts.cookie", cookie);

        vscode.window.showInformationMessage(
            "Authorization completed successful!"
        );
    };
}
