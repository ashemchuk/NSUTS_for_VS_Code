export type TasksContext = Record<
    string,
    { files: Array<string>; compiler?: string }
>;
