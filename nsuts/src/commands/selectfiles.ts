import * as vscode from "vscode";
import * as path from 'path';

export function getSelectFilesHandler() {
    return async () => {
        const config = vscode.workspace.getConfiguration("nsuts");
        const activeTask = config.get<{taskId: string, name: string}>("active_task");
        
        if (!activeTask?.taskId) {
            vscode.window.showErrorMessage("Сначала выберите задачу!");
            return;
        }

        const files = vscode.workspace.findFiles('**/*');
        const items = (await files).map(files => ({
            label: path.basename(files.fsPath),
            description: files.fsPath,
            fileUri: files
        }));

        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: `Выберите файлы для задачи "${activeTask.name}"`,
            ignoreFocusOut: true
        });

        const allTasksFiles = config.get<Array<{taskId: string, files: string[]}>>("selected_files") || [];
        const taskIndex = allTasksFiles.findIndex(task => task.taskId === activeTask.taskId);
        
        if (selected && selected.length > 0) {
            const updatedTask = { 
                taskId: activeTask.taskId, 
                files: selected.map(item => item.fileUri.fsPath) 
            };
            
            taskIndex >= 0 ? allTasksFiles[taskIndex] = updatedTask : allTasksFiles.push(updatedTask);
            await config.update("selected_files", allTasksFiles);
            
            if (selected.length === 1 && selected[0]) {
                vscode.window.showInformationMessage(`Для задачи "${activeTask.name}" 
                    выбран 1 файл: ${selected[0]?.label}`);

            } else {
                vscode.window.showInformationMessage(`Для задачи "${activeTask.name}"
                     выбрано ${selected.length} файлов`);            }
        } else {
            if (taskIndex >= 0) {
                allTasksFiles.splice(taskIndex, 1);
                await config.update("selected_files", allTasksFiles);
            }
            vscode.window.showInformationMessage(`Для задачи "${activeTask.name}" файлы не выбраны`);
        }
    };
}