import * as vscode from "vscode";
const activeTaskItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
);
export function updateActiveTaskStatus(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration("nsuts");
    if (config.has("active_task")) {
        const task = config.get<{ taskId: string; name: string }>(
            "active_task"
        );
        if (task) {
            activeTaskItem.text = task?.name;
        }
    }
    if (activeTaskItem.text) {
        activeTaskItem.show();
    }
}
