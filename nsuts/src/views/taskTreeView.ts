import {
    TreeItem,
    TreeItemCollapsibleState,
    TreeDataProvider,
    Uri,
} from "vscode";
import { client } from "../api/client";

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
        public readonly olympiadId: string
    ) {
        super(name, TreeItemCollapsibleState.Collapsed);
    }
}

export class TaskTreeItem extends TreeItem {
    constructor(
        public readonly taskId: string,
        public readonly name: string,
        public readonly olympiadId: string,
        public readonly tourId: string
    ) {
        super(name, TreeItemCollapsibleState.None);
        this.contextValue = "task";
    }
}

type Item = OlympiadTreeItem | TourTreeItem | TaskTreeItem;

export class TaskTreeDataProvider implements TreeDataProvider<Item> {
    constructor() {}

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

    private async getTours(olympiad: OlympiadTreeItem) {
        await client.POST("/olympiads/enter", {
            body: { olympiad: olympiad.olympiadId },
        });

        const { data } = await client.GET("/tours/list");

        return data?.tours?.map(
            ({ id, title }) => new TourTreeItem(id, title, olympiad.olympiadId)
        );
    }

    private async getTasks(tour: TourTreeItem) {
        await client.GET("/tours/enter", {
            params: { query: { tour: Number(tour.tourId) } },
        });

        const { data } = await client.GET("/submit/submit_info");

        return data?.tasks.map(
            ({ id, title }) =>
                new TaskTreeItem(id, title, tour.olympiadId, tour.tourId)
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
