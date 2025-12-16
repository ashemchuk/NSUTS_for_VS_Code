import { workspace, WorkspaceConfiguration } from "vscode";

import { TaskContext, TasksContext } from "../types";

export class TasksContextRepository {
    private static readonly KEY = "tasks_context";

    public constructor(
        private readonly config: WorkspaceConfiguration = workspace.getConfiguration(
            "nsuts"
        )
    ) {}

    private getBlankTaskContext(): TaskContext {
        return {
            files: [],
        };
    }

    async getTaskContext(taskId: string) {
        const values =
            this.config.get<TasksContext>(TasksContextRepository.KEY) ?? {};

        return values[taskId];
    }

    async updateTaskContext(
        taskId: string,
        updater: (oldValue?: TaskContext) => Partial<TaskContext>
    ) {
        const oldContext =
            this.config.get<TasksContext>(TasksContextRepository.KEY) ?? {};

        await this.config.update(TasksContextRepository.KEY, {
            ...oldContext,
            [taskId]: {
                ...this.getBlankTaskContext(),
                ...updater(oldContext[taskId]),
            },
        });
    }
}
