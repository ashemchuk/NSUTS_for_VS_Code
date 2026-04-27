import { browser, expect } from "@wdio/globals";
import { doAuthenticate } from "../utils";

describe("NSUTS: Edge cases without selected task", () => {
    // Используем before, чтобы залогиниться ОДИН раз на весь файл
    before(async () => {
        await doAuthenticate(browser);
        await browser.pause(1000); 
    });

    // После каждого теста жмем Escape, чтобы закрыть любые зависшие окна/меню
    afterEach(async () => {
        await browser.keys(['Escape']);
        await browser.pause(500);
    });

    it("Показывает предупреждение при выборе компилятора без активной задачи", async () => {
        const workbench = await browser.getWorkbench();

        // Открываем команду
        await workbench.executeCommand("NSUTS: Select Compiler");
        
        // Ждем появления уведомления (максимум 5 секунд)
        await browser.waitUntil(async () => {
            const notifications = await workbench.getNotifications();
            return notifications.length > 0;
        }, { timeout: 5000, timeoutMsg: 'Уведомление не появилось' });

        const notifications = await workbench.getNotifications();
        const messages = await Promise.all(notifications.map(n => n.getMessage()));

        expect(messages).toContain("Сначала выберите задание!");
        
        // Обязательно закрываем уведомление
        for (const n of notifications) { await n.dismiss(); }
    });

    it("Показывает ошибку при попытке выбрать файлы без активной задачи", async () => {
        const workbench = await browser.getWorkbench();

        await workbench.executeCommand("NSUTS: Select Files");
        
        await browser.waitUntil(async () => {
            const notifications = await workbench.getNotifications();
            return notifications.length > 0;
        }, { timeout: 5000 });

        const notifications = await workbench.getNotifications();
        const messages = await Promise.all(notifications.map(n => n.getMessage()));

        expect(messages).toContain("Сначала выберите задачу!");
    });
});