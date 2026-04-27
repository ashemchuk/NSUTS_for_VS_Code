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

        const taskContext = await tasksContextRepo.getTaskContext(
            activeTask.taskId
        );

        const files = vscode.workspace.findFiles("**/*");
        const items = (await files).map((file) => ({
            label: path.basename(file.fsPath),
            description: file.fsPath,
            fileUri: file,
            picked: Boolean(taskContext?.files.includes(file.fsPath)),
        }));

        const activeFile = items.find((item) => {
            return (
                item.fileUri.fsPath ===
                vscode.window.activeTextEditor?.document.uri.fsPath
            );
        });
        if (activeFile) {
            activeFile.picked = true;
        }

        items.sort((a, b) => {
            if (a.picked && !b.picked) {
                return -1;
            }
            if (!a.picked && b.picked) {
                return 1;
            }

            return a.description.localeCompare(b.description);
        });

        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: `Выберите файлы для задачи "${activeTask.name}"`,
            ignoreFocusOut: true,
        });

        if (selected) {
            return await tasksContextRepo.updateTaskContext(
                activeTask.taskId,
                (oldValue) => ({
                    ...oldValue,
                    files: selected.map((item) => item.fileUri.fsPath),
                })
            );
        }
    };
}
