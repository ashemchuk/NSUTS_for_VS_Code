import * as vscode from "vscode";
const solutionResult = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
);
export function updateSolutionResultStatus(str: string) {
    solutionResult.text = str;
    solutionResult.show();
}
