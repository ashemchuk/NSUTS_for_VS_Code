import { browser, expect } from "@wdio/globals";

import { doAuthenticate } from "../utils";

describe("NSUTS: Authenticated", () => {
    beforeEach(async () => {
        await doAuthenticate(browser);
    });

    it("Расширение есть в панеле", async () => {
        const workbench = await browser.getWorkbench();

        const nsutsView = await workbench
            .getActivityBar()
            .getViewControl("NSUTS");

        nsutsView?.openView();

        const selectedView = await workbench
            .getActivityBar()
            .getSelectedViewAction();

        expect(await selectedView.getTitle()).toBe("NSUTS");
    });
});
