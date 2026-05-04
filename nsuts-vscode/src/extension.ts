import * as vscode from "vscode";

import { TaskTreeDataProvider } from "./views/taskTreeView";
import { client, registerAuthMiddleware } from "./api/client";
import { getAuthHandler } from "./commands/auth";
import { getSubmitHandler } from "./commands/submit";
import { getSelectFilesHandler } from "./commands/selectFiles";
import { getSelectTaskHandler } from "./commands/selectTask";
import { renderActiveTaskStatus } from "./statusBar/activeTask";
import { getLogoutHandler } from "./commands/logout";
import { getSelectCompilerHandler } from "./commands/selectCompiler";
import { getRefreshTaskTreeHandler } from "./commands/refreshTaskTree";

import { getDownloadStatementHandler } from "./commands/downloadStatement";
import { getSubmitIssueHandler } from "./commands/submitIssue";
import { getSelectPlatformHandler } from "./commands/selectPlatform";

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

    // РЕГИСТРИРУЕМ КОМАНДУ КРАСИВО, КАК И ОСТАЛЬНЫЕ
    vscode.commands.registerCommand(
        "nsuts.download_statement",
        getDownloadStatementHandler(context)
    );
    vscode.commands.registerCommand(
        "nsuts.submit_issue",
        getSubmitIssueHandler(context)
    );
    vscode.commands.registerCommand(
        "nsuts.select_platform",
        getSelectPlatformHandler(context)
    );

    const taskTreeProvider = new TaskTreeDataProvider();
    vscode.window.registerTreeDataProvider("task-tree", taskTreeProvider);
    vscode.commands.registerCommand(
        "nsuts.refresh_task_tree",
        getRefreshTaskTreeHandler(taskTreeProvider)
    );

    renderActiveTaskStatus();
}

export function deactivate() {}
