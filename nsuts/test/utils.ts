import "dotenv/config";

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function doAuthenticate(browser: WebdriverIO.Browser) {
    const workbench = await browser.getWorkbench();

    const prompt = await workbench.executeCommand("NSUTS: Auth");

    if (!process.env.NSUTS_EMAIL || !process.env.NSUTS_PASSWORD) {
        throw new Error(
            "Переменные NSUTS_EMAIL и NSUTS_PASSWORD не установлены, проверь .env!"
        );
    }

    await prompt.setText(process.env.NSUTS_EMAIL!);
    await prompt.confirm();
    await prompt.setText(process.env.NSUTS_PASSWORD!);
    await prompt.confirm();

    await browser.waitUntil(
        async () => {
            const view = await workbench
                .getActivityBar()
                .getViewControl("NSUTS");
            return view !== undefined;
        },
        { timeout: 15_000 }
    );
}
