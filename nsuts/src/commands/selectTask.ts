import * as vscode from "vscode";

import { client } from "../api/client";

export function getSelectTaskHandler(context: vscode.ExtensionContext) {
    return function (taskItem: any) {
        const taskId = taskItem.taskId;
        if (taskId) {
        }
    };
}
