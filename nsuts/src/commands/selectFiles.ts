import * as vscode from "vscode";
import * as path from "path";

import { TasksContextRepository } from "../repositories/tasksContextRepository";
import { ActiveTaskRepository } from "../repositories/activeTaskRepository";

export function getSelectFilesHandler() {
    return async () => {
        const tasksContextRepo = new TasksContextRepository();
        const activeTaskRepo = new ActiveTaskRepository();

        const activeTask = await activeTaskRepo.getActiveTask();
        if (!activeTask?.taskId) {
            vscode.window.showErrorMessage("Сначала выберите задачу!");
            return;
        }

        const files = vscode.workspace.findFiles("**/*");
        const items = (await files).map((files) => ({
            label: path.basename(files.fsPath),
            description: files.fsPath,
            fileUri: files,
        }));

        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: `Выберите файлы для задачи "${activeTask.name}"`,
            ignoreFocusOut: true,
        });

        if (selected) {
            await tasksContextRepo.updateTaskContext(
                activeTask.taskId,
                (oldValue) => ({
                    ...oldValue,
                    files: selected.map((item) => item.fileUri.fsPath),
                })
            );
        }
    };
}
