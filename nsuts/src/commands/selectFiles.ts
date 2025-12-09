import * as vscode from "vscode";
import * as path from "path";
import { TasksContext } from "../types";

export function getSelectFilesHandler() {
    return async () => {
        const config = vscode.workspace.getConfiguration("nsuts");
        const activeTask = config.get<{ taskId: string; name: string }>(
            "active_task"
        );

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

        const tasksContext = config.get<TasksContext>("tasks_context") || {};
        const curContext = tasksContext[activeTask.taskId];
        if (selected) {
            tasksContext[activeTask.taskId] = {
                ...curContext,
                files: selected.map((item) => item.fileUri.fsPath),
            };
            await config.update("tasks_context", tasksContext);
        }
    };
}
