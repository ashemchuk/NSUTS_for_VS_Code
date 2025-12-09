import * as vscode from "vscode";

import { client } from "../api/client";
import { TaskTreeItem } from "../views/taskTreeView";
import { updateActiveTaskStatus } from "../statusBar/activeTask";

export function getSelectTaskHandler(context: vscode.ExtensionContext) {
    return async function (taskItem?: TaskTreeItem) {
        if (!taskItem) {
            // TODO
            vscode.window.showInformationMessage(
                "TODO: command was invoked directly or via shortcut"
            );
            return;
        }
        const { taskId, name, olympiadId, tourId } = taskItem;
        const config = vscode.workspace.getConfiguration("nsuts");
        await config.update("active_task", {
            taskId,
            name,
            olympiadId,
            tourId,
        });
        updateActiveTaskStatus(context);
    };
}
