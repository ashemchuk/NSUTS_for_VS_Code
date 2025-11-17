import * as vscode from "vscode";
import { client } from "../api/client";

export function getSubmitHandler(context: vscode.ExtensionContext) {
    return function () {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const text = editor.document.getText();
        client.POST("/submit/do_submit", {
            body: {
                langId: "mingw8.1c",
                sourceText: text,
                taskId: "119370",
            },
            bodySerializer(body) {
                const fd = new FormData();
                if (!body) {
                    return;
                }
                for (const [key, value] of Object.entries(body)) {
                    fd.append(key, value);
                }
                return fd;
            },
        });
    };
}
