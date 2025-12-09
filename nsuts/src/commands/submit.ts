import * as vscode from "vscode";
import { client } from "../api/client";
import { getSelectTaskHandler } from "./selectTask";
import { TasksContext } from "../types";

export function getSubmitHandler(context: vscode.ExtensionContext) {
    return async function () {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const config = vscode.workspace.getConfiguration("nsuts");
        // if (!auth)
        let activeTask = config.get<{ taskId: string; name: string }>(
            "active_task"
        );
        if (!activeTask) {
            await vscode.commands.executeCommand("nsuts.select_task");
            activeTask = config.get<{ taskId: string; name: string }>(
                "active_task"
            )!;
        }
        // if (!compiler)

        const tasksContext = config.get<TasksContext>("tasks_context") ?? {};
        const taskContext = tasksContext[activeTask.taskId];
        if (!taskContext) {
            await vscode.window.showErrorMessage(
                "No selected files for this task"
            );
            return;
        }
        const { files, compiler = "mingw8.1c" } = taskContext;

        if (files.length === 1) {
            const text = await vscode.workspace.fs.readFile(
                vscode.Uri.file(files[0]!)
            );

            await client.POST("/submit/do_submit", {
                body: {
                    langId: compiler,
                    sourceText: Buffer.from(text).toString("utf-8"),
                    taskId: activeTask.taskId,
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
        } else {
            //TODO: multiple files sending
        }
    };
}
