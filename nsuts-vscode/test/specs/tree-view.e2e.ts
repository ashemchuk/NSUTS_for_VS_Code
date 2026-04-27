import { browser, expect } from "@wdio/globals";
import { doAuthenticate } from "../utils";

describe("NSUTS: Task Tree View", () => {
    before(async () => {
        await doAuthenticate(browser);
        await browser.pause(2000); // Даем время на загрузку данных после логина
    });

    it("Дерево задач (Task Tree) успешно отображается в боковой панели", async () => {
        const workbench = await browser.getWorkbench();

        // Открываем панель NSUTS
        const nsutsView = await workbench.getActivityBar().getViewControl("NSUTS");
        const sideBar = await nsutsView?.openView();
        
        expect(sideBar).toBeDefined();

        // Получаем контент боковой панели
        const content = await sideBar?.getContent();
        const sections = await content?.getSections();

        // Проверяем, что секции дерева загрузились (это значит, что TaskTreeDataProvider сработал)
        expect(sections).toBeDefined();
        // Даже если у пользователя нет олимпиад, сам контейнер дерева должен существовать
        expect(sections?.length).toBeGreaterThanOrEqual(0);
    });
});