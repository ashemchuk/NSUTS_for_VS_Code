import { workspace } from "vscode";

/**
 * Get the base URL from configuration.
 * Defaults to fresh.nsuts if not set.
 */
export function getBaseUrl(): string {
    const config = workspace.getConfiguration("nsuts");
    return (
        config.get<string>("baseUrl") || "https://fresh.nsuts.ru/nsuts-new/api/"
    );
}

/**
 * Set the base URL in configuration (workspace level).
 */
export async function setBaseUrl(url: string): Promise<void> {
    const config = workspace.getConfiguration("nsuts");
    await config.update("baseUrl", url);
}
