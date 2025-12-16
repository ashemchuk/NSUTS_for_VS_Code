import * as vscode from "vscode";
import { ActiveTaskRepository } from "../repositories/activeTaskRepository";

const activeTaskItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
);

export async function renderActiveTaskStatus() {
    const repo = new ActiveTaskRepository();

    const activeTask = await repo.getActiveTask();

    if (activeTask) {
        activeTaskItem.text = activeTask?.name;
    }
    if (activeTaskItem.text) {
        activeTaskItem.show();
    }
}
