import { browser, expect } from "@wdio/globals";
import { doAuthenticate } from "../utils";

describe("NSUTS: Logout", () => {
    beforeEach(async () => {
        // Сначала логинимся перед тестом логаута
        await doAuthenticate(browser);
    });

    it("Команда выхода отрабатывает и показывает уведомление", async () => {
        const workbench = await browser.getWorkbench();

        // Вызываем команду логаута из Command Palette
        await workbench.executeCommand("NSUTS: Logout");

        // Ждем небольшую паузу, чтобы уведомление успело появиться
        await browser.pause(500);

        // Получаем все всплывшие уведомления
        const notifications = await workbench.getNotifications();
        const messages = await Promise.all(notifications.map(n => n.getMessage()));

        // Проверяем, что появилось сообщение из getLogoutHandler
        expect(messages).toContain("You're logged out");
    });
});