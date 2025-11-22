import * as vscode from "vscode";

import { TaskTreeDataProvider } from "./views/taskTreeView";
import { registerAuthMiddleware } from "./api/client";
import { getAuthHandler } from "./commands/auth";
import { getSelectTaskHandler } from "./commands/selectTask";
import { updateActiveTaskStatus } from "./statusBar/activeTask";
export function activate(context: vscode.ExtensionContext) {
    registerAuthMiddleware(context);

    vscode.commands.registerCommand("nsuts.auth", getAuthHandler(context));
    vscode.commands.registerCommand(
        "nsuts.select_task",
        getSelectTaskHandler(context)
    );
    vscode.window.registerTreeDataProvider(
        "task-tree",
        new TaskTreeDataProvider()
    );
    updateActiveTaskStatus(context);
}

export function deactivate() {}
