import * as vscode from "vscode";

import { client } from "../api/client";
import { PathsLoginPostRequestBodyApplicationJsonMethod } from "../api/api";

export async function getAuthCookie(
    email: string,
    password: string
): Promise<string> {
    const { response } = await client.POST("/login", {
        body: {
            email,
            password,
            method: PathsLoginPostRequestBodyApplicationJsonMethod.internal,
        },
    });

    const cookie = response.headers.getSetCookie().at(0);

    if (!cookie) {
        throw new Error("Login or password is not correct");
    }

    return cookie;
}

export function getAuthHandler(context: vscode.ExtensionContext) {
    return async function () {
        const { email, password } = await getAuthData();

        const cookie = await getAuthCookie(email, password);

        await context.secrets.store("nsuts.email", email);
        await context.secrets.store("nsuts.password", password);
        await context.secrets.store("nsuts.cookie", cookie);

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
