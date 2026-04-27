import { WorkspaceConfiguration, workspace } from "vscode";
import { ActiveTask } from "../types";

export class ActiveTaskRepository {
    private static readonly KEY = "active_task";

    public constructor(
        private readonly config: WorkspaceConfiguration = workspace.getConfiguration(
            "nsuts"
        )
    ) {}

    async getActiveTask() {
        return this.config.get<ActiveTask>(ActiveTaskRepository.KEY);
    }

    async setActiveTask(activeTask: ActiveTask) {
        await this.config.update(ActiveTaskRepository.KEY, activeTask);
    }
}
