import * as vscode from "vscode";

import { TaskTreeItem } from "../views/taskTreeView";
import { renderActiveTaskStatus } from "../statusBar/activeTask";
import { ActiveTaskRepository } from "../repositories/activeTaskRepository";

export function getSelectTaskHandler(context: vscode.ExtensionContext) {
    return async function (taskItem?: TaskTreeItem) {
        if (!taskItem) {
            vscode.window.showInformationMessage(
                "DEBUG: if you see this, something fked up"
            );
            return;
        }

        const activeTaskRepository = new ActiveTaskRepository();
        await activeTaskRepository.updateActiveTask(taskItem);

        await renderActiveTaskStatus();
    };
}
