import * as vscode from "vscode";

import { TaskTreeDataProvider } from "./views/taskTreeView";
import { registerAuthMiddleware } from "./api/client";
import { getAuthHandler } from "./commands/auth";
import { getSubmitHandler } from "./commands/submit";
import { getSelectFilesHandler } from "./commands/selectFiles";
import { getSelectTaskHandler } from "./commands/selectTask";
import { renderActiveTaskStatus } from "./statusBar/activeTask";
import { getLogoutHandler } from "./commands/logout";

import { getSelectCompilerHandler } from "./commands/selectCompiler";
export function activate(context: vscode.ExtensionContext) {
    registerAuthMiddleware(context);

    context.secrets.keys().then((keys) => {
        vscode.commands.executeCommand(
            "setContext",
            "nsuts.authorized",
            keys.includes("nsuts.email") && keys.includes("nsuts.password")
        );
    });

    vscode.commands.registerCommand(
        "nsuts.select_compiler",
        getSelectCompilerHandler(context)
    );
    vscode.commands.registerCommand("nsuts.auth", getAuthHandler(context));
    vscode.commands.registerCommand("nsuts.submit", getSubmitHandler(context));
    vscode.commands.registerCommand(
        "nsuts.select_task",
        getSelectTaskHandler(context)
    );
    vscode.commands.registerCommand("nsuts.logout", getLogoutHandler(context));
    vscode.commands.registerCommand(
        "nsuts.select_files",
        getSelectFilesHandler()
    );

    vscode.window.registerTreeDataProvider(
        "task-tree",
        new TaskTreeDataProvider()
    );

    renderActiveTaskStatus();
}

export function deactivate() {}
