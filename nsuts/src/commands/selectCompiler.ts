import * as vscode from "vscode";

import { client } from "../api/client";

export async function getCompilers(tourId: string) {
    await client.GET("/tours/enter", {
        params: { query: { tour: Number(tourId) } },
    });
        
    const { data } = await client.GET("/submit/submit_info");

    return data?.langs.map(({ id, title }) => ({
        description: id,
        label: title,
    }));
}

export function getSelectCompilerHandler(context: vscode.ExtensionContext) {
    return async function () {
        const config = vscode.workspace.getConfiguration("nsuts");
        const activeTask = config.get("active_task") as any;
        if (!activeTask?.taskId) {
            vscode.window.showWarningMessage("Сначала выберите задание!");
            return;
        }

        const tourId = activeTask.taskId;

        let compilers;
        try {
            compilers = await getCompilers(tourId);
        } catch (err: any) {
            vscode.window.showErrorMessage("Ошибка загрузки списка компиляторов: " + err.message);
            return;
        }

        if (!compilers || compilers.length === 0) {
            vscode.window.showErrorMessage("Нет доступных компиляторов.");
            return;
        }

        const selected = await vscode.window.showQuickPick(compilers, {
            title: "Выберите компилятор",
        });

        if (!selected) return;

        await config.update("active_compiler",selected.description, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(
            `Компилятор выбран: ${selected.description}`
        );
    };
}
