import * as vscode from "vscode";

export function getSubmitIssueHandler(context: vscode.ExtensionContext) {
    return async function () {
        const url = "https://github.com/ashemchuk/nsuts-ide-plugins/issues/new";
        try {
            await vscode.env.openExternal(vscode.Uri.parse(url));
        } catch (error) {
            vscode.window.showErrorMessage(
                `Не удалось открыть ссылку: ${error}`
            );
        }
    };
}
