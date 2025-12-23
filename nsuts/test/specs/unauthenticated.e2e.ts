import { browser, expect } from "@wdio/globals";

describe("NSUTS: Unauthenticated", () => {
    it("Доступна команда NSUTS: Auth", async () => {
        const workbench = await browser.getWorkbench();

        expect(() => workbench.executeCommand("NSUTS: Auth")).not.toThrow();
    });
});
