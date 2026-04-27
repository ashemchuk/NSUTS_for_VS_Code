import { browser, expect } from "@wdio/globals";
import { doAuthenticate } from "../utils";

describe("NSUTS: Download Statement", () => {
    before(async () => {
        await doAuthenticate(browser);
    });

    it("Команда скачивания условий не падает при пустом вызове (без выбранного тура)", async () => {
        // Вызываем команду напрямую по её ID под капотом VS Code
        await browser.executeWorkbench(async (vscodeApi) => {
            await vscodeApi.commands.executeCommand("nsuts.download_statement");
        });
        
        // Ждем секунду, чтобы убедиться, что код сделал тихий return и не выкинул ошибку
        await browser.pause(1000);
        
        const workbench = await browser.getWorkbench();
        const notifications = await workbench.getNotifications();
        
        // Проверяем, что нет уведомлений с типом 'error'
        const errorNotifications = [];
        for (const n of notifications) {
            const type = await n.getType();
            if (type === 'error') {
                errorNotifications.push(n);
            }
        }
        
        expect(errorNotifications.length).toBe(0);
    });
});