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

export default async function helloWorldHandler() {
    const config = vscode.workspace.getConfiguration();

    const email = config.get<string>("nsuts.email"),
        password = config.get<string>("nsuts.password");

    if (!email || !password) {
        vscode.window.showErrorMessage("Email or password is not setted up!");
        return;
    }

    const cookie = await getAuthCookie(email, password);

    vscode.window.showInformationMessage(`Got cookie = ${cookie}`);
}
