import * as vscode from "vscode";
import { client } from "../api/client";

export function getSubmitHandler(context: vscode.ExtensionContext) {
    return async function () {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        // if (!auth)
        // if (!selected task)
        // if (!selected compiler)
        // if (! associated files)
        const text = editor.document.getText();
        await client.POST("/submit/do_submit", {
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
