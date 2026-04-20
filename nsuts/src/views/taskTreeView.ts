import {
    TreeItem,
    TreeItemCollapsibleState,
    TreeDataProvider,
    Uri,
    EventEmitter,
    Event,
    ThemeIcon,
} from "vscode";
import { client } from "../api/client";
import { ReportStatus } from "../api/api";

// olympiads -> tours -> tasks

class OlympiadTreeItem extends TreeItem {
    constructor(
        public readonly olympiadId: string,
        public readonly name: string,
        // public readonly registered: boolean,
        // public readonly frozen: boolean,
        public readonly coverUrl: string
    ) {
        super(name, TreeItemCollapsibleState.Collapsed);
        
        this.iconPath = {
            light: Uri.parse(`https://fresh.nsuts.ru${coverUrl}`),
            dark: Uri.parse(`https://fresh.nsuts.ru${coverUrl}`),
        };
    }
}

class TourTreeItem extends TreeItem {
    constructor(
        public readonly tourId: string,
        public readonly name: string,
        public readonly olympiadId: string,
        public readonly taskCount: number,
        public readonly acceptedCount: number
    ) {
        const label = name +
            (taskCount > 0
                ? ` (${acceptedCount}/${taskCount})`
                : "");

        super(label, TreeItemCollapsibleState.Collapsed);

        this.id = `tour:${tourId}`;
    }
}

export class TaskTreeItem extends TreeItem {
    constructor(
        public readonly taskId: string,
        public readonly name: string,
        public readonly olympiadId: string,
        public readonly tourId: string,
        public readonly accepted: boolean
    ) {
        super(name, TreeItemCollapsibleState.None);

        this.contextValue = "task";

        if (accepted) {
            this.iconPath = new ThemeIcon("check");
            this.tooltip = `${name} (Accepted)`;
        }
    }
}

type Item = OlympiadTreeItem | TourTreeItem | TaskTreeItem;

export class TaskTreeDataProvider implements TreeDataProvider<Item> {
    constructor() {}
    private _onDidChangeTreeData: EventEmitter<Item | undefined | null | void> =
        new EventEmitter<Item | undefined | null | void>();
    readonly onDidChangeTreeData: Event<Item | undefined | null | void> =
        this._onDidChangeTreeData.event;

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: Item) {
        return element;
    }

    public getChildren(element?: Item | undefined) {
        if (element) {
            if (element instanceof OlympiadTreeItem) {
                return this.getTours(element);
            }

            if (element instanceof TourTreeItem) {
                return this.getTasks(element);
            }
        } else {
            return this.getOlympiads();
        }
    }

    private async getTours(olympiad: OlympiadTreeItem): Promise<TourTreeItem[]> {
        const enterOlympiad = await client.POST("/olympiads/enter", {
            body: { olympiad: olympiad.olympiadId },
        });

        if (enterOlympiad.error) return [];

        const toursRes = await client.GET("/tours/list");
        if (!toursRes.data?.tours) return [];

        const result: TourTreeItem[] = [];

        for (const { id, title } of toursRes.data.tours) {
            await client.GET("/tours/enter", {
                params: { query: { tour: Number(id) } },
            });

            const submitInfo = await client.GET("/submit/submit_info");
            const tasks = submitInfo.data?.tasks ?? [];
            const taskIds = tasks.map(t => t.id);
            const taskCount = taskIds.length;

            const { data: reportData } = await client.GET("/report/get_report");
            
            const tourSubmits = (reportData?.submits ?? []).filter(s => taskIds.includes(s.task_id));
            
            const lastSubmitByTask = new Map();
            for (const submit of tourSubmits) {
                const prev = lastSubmitByTask.get(submit.task_id);
                if (!prev || Number(submit.id) > Number(prev.id)) {
                    lastSubmitByTask.set(submit.task_id, submit);
                }
            }
            
            let acceptedCount = 0;
            for (const [taskId, submit] of lastSubmitByTask.entries()) {
                if (submit.status === ReportStatus.Successful) {
                    acceptedCount++;
                }
            }

            result.push(
                new TourTreeItem(
                    id,
                    title,
                    olympiad.olympiadId,
                    taskCount,
                    acceptedCount
                )
            );
        }

        return result;
    }

    private async getTasks(tour: TourTreeItem) {
        await client.GET("/tours/enter", {
            params: { query: { tour: Number(tour.tourId) } },
        });

        const { data } = await client.GET("/submit/submit_info");
        const { data: reportData } = await client.GET("/report/get_report");
        const acceptedTaskIds = new Set(
            (reportData?.submits ?? [])
                .filter((report) => report.status === ReportStatus.Successful)
                .map((report) => report.task_id)
        );

        return data?.tasks.map(
            ({ id, title }) =>
                new TaskTreeItem(
                    id,
                    title,
                    tour.olympiadId,
                    tour.tourId,
                    acceptedTaskIds.has(id)
                )
        );
    }

    private async getOlympiads() {
        const { data } = await client.GET("/olympiads/list");
        return data?.registeredTo?.map(
            ({ id, title, cover_url }) =>
                new OlympiadTreeItem(id, title, cover_url)
        );
    }
}
