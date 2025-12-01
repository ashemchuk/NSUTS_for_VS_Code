import * as vscode from "vscode";
import * as path from 'path';

export function getSelectFilesHandler() {
    return async () => {
        const files = vscode.workspace.findFiles('**/*');
        const items = (await files).map(files => ({
            label: path.basename(files.fsPath),
            description: files.fsPath,
            fileUri: files
        }));

        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Выберите один или несколько файлов',
            ignoreFocusOut: true
        });

        if (selected && selected.length > 0) {
            const config = vscode.workspace.getConfiguration("nsuts");
            await config.update("selected_files", selected.map(item => ({
                fsPath: item.fileUri.fsPath,
            })));

            if (selected.length == 1) {
                vscode.window.showInformationMessage(`Выбран 1 файл: ${selected[0]?.label}`);
            } else {
                vscode.window.showInformationMessage(`Выбрано ${selected.length} файлов:
                    ${selected.map(s => s.label).join(', ')}`);
            }
        } else {
            const config = vscode.workspace.getConfiguration("nsuts");
            await config.update("selected_files", undefined);
            
            vscode.window.showInformationMessage('Файлы не выбраны');
        }
    }
}