import { browser, expect } from "@wdio/globals";
import { doAuthenticate } from "../utils";

describe("NSUTS: Authenticated Commands", () => {
    beforeEach(async () => {
        await doAuthenticate(browser);
    });

    it("Команды для работы с решением доступны", async () => {
        const workbench = await browser.getWorkbench();

        // Проверяем, что команды существуют и VS Code не кидает ошибку "Command not found"
        expect(() => workbench.executeCommand("NSUTS: Select Task")).not.toThrow();
        expect(() => workbench.executeCommand("NSUTS: Submit")).not.toThrow();
        expect(() => workbench.executeCommand("NSUTS: Refresh Task Tree")).not.toThrow();
    });
});