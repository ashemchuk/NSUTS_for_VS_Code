import * as vscode from "vscode";
import JSZip from "jszip";
import * as path from "node:path";

import { client } from "../api/client";
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
            (await vscode.commands.executeCommand<ActiveTask>(
                "nsuts.select_task"
            ));
        if (!activeTask) {
            return;
        }

        let taskContext =
            (await tasksContextRepo.getTaskContext(activeTask.taskId)) ??
            (await vscode.commands
                .executeCommand<TasksContext>("nsuts.select_files")
                .then((tasks) => tasks[activeTask.taskId]));
        if (!taskContext) {
            return;
        }

        const {
            files,
            compiler = await vscode.commands.executeCommand<string>(
                "nsuts.select_compiler"
            ),
        } = taskContext;
        if (!compiler) {
            return;
        }

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Задача проверяется...",
            },
            async (process) => {
                const progressInterval = setInterval(
                    () => process.report({ increment: 2.5 }),
                    250
                );

                if (files.length === 1) {
                    const text = await vscode.workspace.fs.readFile(
                        vscode.Uri.file(files[0]!)
                    );

                    const { error } = await client.POST("/submit/do_submit", {
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

                    if (error) {
                        // @ts-ignore TODO: add 400 error in openapi spec
                        vscode.window.showErrorMessage(error.error);
                        return;
                    }
                } else {
                    const zip = new JSZip();
                    await Promise.all(
                        files.map(async (file) => {
                            const text = Buffer.from(
                                await vscode.workspace.fs.readFile(
                                    vscode.Uri.file(file)
                                )
                            );
                            zip.file(path.basename(file), text);
                        })
                    );
                    const { error } = await client.POST("/submit/do_submit", {
                        body: {
                            langId: compiler,
                            // @ts-ignore
                            sourceFile: await zip.generateAsync({
                                type: "blob",
                            }),
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

                    if (error) {
                        // @ts-ignore TODO: add 400 error in openapi spec
                        vscode.window.showErrorMessage(error.error);
                        return;
                    }
                }

                await new Promise((resolve) => setTimeout(resolve, 5000));

                await getReport(activeTask);

                clearInterval(progressInterval);
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
        vscode.window.showErrorMessage("There're not any reports");
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
