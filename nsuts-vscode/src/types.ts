export type TasksContext = Record<string, TaskContext>;

export type TaskContext = { files: Array<string>; compiler?: string };

export type ActiveTask = {
    taskId: string;
    name: string;
    tourId: string;
    olympiadId: string;
};
