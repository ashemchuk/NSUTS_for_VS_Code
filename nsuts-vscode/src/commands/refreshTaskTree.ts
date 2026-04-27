import { TaskTreeDataProvider } from "../views/taskTreeView";

export function getRefreshTaskTreeHandler(provider: TaskTreeDataProvider) {
    return async () => {
        provider.refresh();
    };
}
