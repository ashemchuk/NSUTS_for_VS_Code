import * as vscode from "vscode";
import { client } from "../api/client";
import { getSelectTaskHandler } from "./selectTask";
import { ActiveTask, TasksContext } from "../types";
import { updateSolutionResultStatus } from "../statusBar/solutionResult";
import { ActiveTaskRepository } from "../repositories/activeTaskRepository";
import { TasksContextRepository } from "../repositories/tasksContextRepository";

export function getSubmitHandler(context: vscode.ExtensionContext) {
    return async function () {
        const activeTaskRepo = new ActiveTaskRepository();
        const tasksContextRepo = new TasksContextRepository();

        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        let activeTask =
            (await activeTaskRepo.getActiveTask()) ??
            (await vscode.commands.executeCommand("nsuts.select_task"));
        if (!activeTask) {
            return;
        }

        const taskContext = await tasksContextRepo.getTaskContext(
            activeTask.taskId
        );
        if (!taskContext) {
            await vscode.window.showErrorMessage(
                "No selected files for this task"
            );
            return;
        }
        const {
            files,
            compiler = await vscode.commands.executeCommand(
                "nsuts.select_compiler"
            ),
        } = taskContext;

        if (!compiler) {
            return;
        }
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Задача проверяется...",
            },
            async (process) => {
                process.report({ increment: 0 });

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

                await new Promise((resolve) => setTimeout(resolve, 5000));

                await getReport(activeTask);
            }
        );
    };
}

async function getReport(activeTask: ActiveTask) {
    await client.POST("/olympiads/enter", {
        body: { olympiad: activeTask.olympiadId },
    });
    await client.GET("/tours/enter", {
        params: { query: { tour: Number(activeTask.tourId) } },
    });
    const res = await client.GET("/report/get_report");
    if (!res.data && res.error) {
        throw new Error("Couldn't fetch result");
    }
    const reports = res.data.submits;
    if (!reports || reports.length < 1) {
        // throw
        await vscode.window.showErrorMessage("There're not any reports");
        return;
    }
    const report = reports
        .filter((rep) => rep.task_id === activeTask.taskId)
        .reduce((acc, cur) => (Number(acc.id) > Number(cur.id) ? acc : cur));
    if (report.status === "4") {
        //unsuccessful
        updateSolutionResultStatus(report.result_line);
    }
    if (report.status === "3") {
        // successful
        updateSolutionResultStatus("Accepted!");
    }
    vscode.window.showInformationMessage(
        "Результат по задаче " + activeTask.name + " : " + report.result_line
    );
}
