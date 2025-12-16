import * as vscode from "vscode";

import { TaskTreeItem } from "../views/taskTreeView";
import { renderActiveTaskStatus } from "../statusBar/activeTask";
import { ActiveTaskRepository } from "../repositories/activeTaskRepository";
import { ActiveTask } from "../types";

export function getSelectTaskHandler(context: vscode.ExtensionContext) {
    return async function (
        taskItem?: TaskTreeItem
    ): Promise<ActiveTask | undefined> {
        if (!taskItem) {
            vscode.window.showInformationMessage(
                "DEBUG: if you see this, something fked up"
            );
            return;
        }

        const activeTaskRepository = new ActiveTaskRepository();
        const { name, taskId, tourId, olympiadId } = taskItem;
        const task: ActiveTask = { name, taskId, tourId, olympiadId };

        await activeTaskRepository.setActiveTask(task);
        vscode.window.showInformationMessage("Выбрана задача: " + name);
        await renderActiveTaskStatus();

        return task;
    };
}
