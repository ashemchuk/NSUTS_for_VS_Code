import { browser, expect } from "@wdio/globals";
import { doAuthenticate } from "../utils";

describe("NSUTS: Select Task (Direct Call)", () => {
    before(async () => {
        await doAuthenticate(browser);
        await browser.pause(1000); 
    });

    afterEach(async () => {
        await browser.keys(['Escape']);
        await browser.pause(500);
    });

    it("Показывает уведомление 'Please, select task', если вызвать команду не из дерева", async () => {
        const workbench = await browser.getWorkbench();

        // Вызываем команду напрямую из палитры
        await workbench.executeCommand("NSUTS: Select Task");
        
        // Ждем появления уведомления
        await browser.waitUntil(async () => {
            const notifications = await workbench.getNotifications();
            return notifications.length > 0;
        }, { timeout: 5000, timeoutMsg: 'Уведомление не появилось' });

        const notifications = await workbench.getNotifications();
        const messages = await Promise.all(notifications.map(n => n.getMessage()));

        // Проверяем точный текст из файла selectTask.ts
        expect(messages).toContain("Please, select task");
        
        // Закрываем уведомления за собой
        for (const n of notifications) { await n.dismiss(); }
    });
});