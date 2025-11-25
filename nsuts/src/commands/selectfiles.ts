import * as vscode from "vscode";
import * as path from 'path';
import { client } from "../api/client";
import { fileState } from "../state";

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
            const selectedUris = selected.map(item => item.fileUri);
            fileState.setCurrentSelection(selectedUris);

            if (selected.length == 1) {
                vscode.window.showInformationMessage(`Выбран 1 файл: ${selected[0]?.label}`);
            } else {
                vscode.window.showInformationMessage(`Выбрано ${selected.length} файлов:
                    ${selected.map(s => s.label).join(', ')}`);
            }
        } else {
            fileState.clearSelection();
            vscode.window.showInformationMessage('Файлы не выбраны');
        }
    }
}