import * as vscode from "vscode";

import { client } from "../api/client";
import { ActiveTaskRepository } from "../repositories/activeTaskRepository";
import { TasksContextRepository } from "../repositories/tasksContextRepository";
import { ActiveTask } from "../types";

export async function getCompilers({ tourId, olympiadId }: ActiveTask) {
    await client.POST("/olympiads/enter", {
        body: { olympiad: olympiadId },
    });

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
        const activeTaskRepo = new ActiveTaskRepository();
        const tasksContextRepo = new TasksContextRepository();

        const activeTask = await activeTaskRepo.getActiveTask();

        if (!activeTask?.taskId) {
            await vscode.window.showWarningMessage("Сначала выберите задание!");
            return;
        }

        let compilers = await getCompilers(activeTask).catch(async (err) => {
            await vscode.window.showErrorMessage(
                "Ошибка загрузки списка компиляторов: " + err.message
            );
            throw err;
        });

        if (!compilers || compilers.length === 0) {
            await vscode.window.showErrorMessage("Нет доступных компиляторов.");
            return;
        }

        const selected = await vscode.window.showQuickPick(compilers, {
            title: "Выберите компилятор",
        });

        if (!selected) {
            return;
        }

        await tasksContextRepo.updateTaskContext(
            activeTask.taskId,
            (oldValue) => ({ ...oldValue, compiler: selected.description })
        );

        await vscode.window.showInformationMessage(
            `Компилятор выбран: ${selected.description}`
        );

        return selected.description;
    };
}
