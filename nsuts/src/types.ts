export type TasksContext = Record<
    string,
    { files: Array<string>; compiler?: string }
>;
export type ActiveTask = {
    taskId: string;
    name: string;
    tourId: string;
    olympiadId: string;
};
