import * as vscode from "vscode";

import helloWorldHandler from "./commands/helloWorld";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand("nsuts.helloWorld", helloWorldHandler)
    );
}

export function deactivate() {}
