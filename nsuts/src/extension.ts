import * as vscode from "vscode";

import { TaskTreeDataProvider } from "./views/taskTreeView";
import { registerAuthMiddleware } from "./api/client";
import { getAuthHandler } from "./commands/auth";
import { getSubmitHandler } from "./commands/submit";

import { getSelectTaskHandler } from "./commands/selectTask";
import { updateActiveTaskStatus } from "./statusBar/activeTask";
import { getLogoutHandler } from "./commands/logout";
export function activate(context: vscode.ExtensionContext) {
    registerAuthMiddleware(context);

    vscode.commands.registerCommand("nsuts.auth", getAuthHandler(context));
    vscode.commands.registerCommand("nsuts.submit", getSubmitHandler(context));
    vscode.commands.registerCommand(
        "nsuts.select_task",
        getSelectTaskHandler(context)
    );
    vscode.commands.registerCommand("nsuts.logout", getLogoutHandler(context));
    context.secrets.keys().then((keys) => {
        vscode.commands.executeCommand(
            "setContext",
            "nsuts.authorized",
            keys.includes("nsuts.email") && keys.includes("nsuts.password")
        );
    });
    vscode.window.registerTreeDataProvider(
        "task-tree",
        new TaskTreeDataProvider()
    );
    updateActiveTaskStatus(context);
}

export function deactivate() {}
