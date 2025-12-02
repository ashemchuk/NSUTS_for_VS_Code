import * as vscode from "vscode";
import * as path from "path";

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

        const prev =
            config.get<Record<string, Array<string>>>("selected_files") || {};
        if (selected) {
            prev[activeTask.taskId] = selected.map(
                (item) => item.fileUri.fsPath
            );
        }
        config.update("selected_files", prev);
    };
}
