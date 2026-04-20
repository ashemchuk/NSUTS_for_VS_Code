import * as vscode from "vscode";
import JSZip from "jszip";
import * as path from "node:path";

import { client } from "../api/client";
import { ActiveTask, TasksContext } from "../types";
import { updateSolutionResultStatus } from "../statusBar/solutionResult";
import { ActiveTaskRepository } from "../repositories/activeTaskRepository";
import { TasksContextRepository } from "../repositories/tasksContextRepository";
import { ReportStatus } from "../api/api";

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

                await getReport(activeTask);

                clearInterval(progressInterval);
            }
        );
    };
}

async function getReport(activeTask: ActiveTask) {
    const report = await pollResolvedReports(activeTask);
    if (report.status === ReportStatus.Unsuccessful) {
        updateSolutionResultStatus(report.result_line);
    }
    if (report.status === ReportStatus.Successful) {
        updateSolutionResultStatus("Accepted!");
    }
    vscode.window.showInformationMessage(
        "Результат по задаче " + activeTask.name + " : " + translationReportResult(report.result_line)
    );
}

function translationReportResult(status: string) {
    if (/^A+$/.test(status)) {
        return "🏆 ACCEPTED!";
    }
    if (status == "C") {
        return "🚧 Compile Error";
    }
    if (/^A*W$/.test(status)) {
        const acceptedCount = (status.match(/A/g) ?? []).length;
        return `🗿 Wrong answer on test ${acceptedCount + 1}`;
    }
    if (/^A*T$/.test(status)) {
        const acceptedCount = (status.match(/A/g) ?? []).length;
        return `⌛ Time Limit Exceeded on test ${acceptedCount + 1}`;
    }
    if (/^A*R$/.test(status)) {
        const acceptedCount = (status.match(/A/g) ?? []).length;
        return `🔥 Run-Time Error on test ${acceptedCount + 1}`;
    }
    if (/^A*M$/.test(status)) {
        const acceptedCount = (status.match(/A/g) ?? []).length;
        return `🤯 Memory Limit Exceeded on test ${acceptedCount + 1}`;
    }
    if (/^A*AO$/.test(status)) {
        const acceptedCount = (status.match(/A/g) ?? []).length;
        return `🔍 No Output File on test ${acceptedCount + 1}`;
    }
    if (/^A*P$/.test(status)) {
        const acceptedCount = (status.match(/A/g) ?? []).length;
        return `🚽 Presentation Error on test ${acceptedCount + 1}`;
    }
    if (/^A*D$/.test(status)) {
        const acceptedCount = (status.match(/A/g) ?? []).length;
        return `🥶 Deadlock - Timeout on test ${acceptedCount + 1}`;
    }
    return status;
}

async function pollResolvedReports(activeTask: ActiveTask) {
    for (let i = 0, t = 1500; ; i++) {
        if (i > 25) {
            throw new Error("Report check timeout");
        }
        await new Promise((resolve) => setTimeout(resolve, t));
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
        const reports = res.data.submits?.filter(
            (rep) => rep.task_id === activeTask.taskId
        );
        if (!reports || reports.length < 1) {
            throw new Error("There're not any reports");
        }
        const report = reports.reduce((acc, cur) =>
            Number(acc.id) > Number(cur.id) ? acc : cur
        );
        if (
            report.status === ReportStatus.Successful ||
            report.status === ReportStatus.Unsuccessful
        ) {
            return report;
        }
        t = t > 15000 ? t : t * 2;
    }
}
