import { commands, ExtensionContext, window } from "vscode";
import { getBaseUrl } from "../config";

function getCurrentHostSecretKeys() {
    const host = new URL(getBaseUrl()).host;
    return {
        emailKey: `nsuts.email.${host}`,
        passwordKey: `nsuts.password.${host}`,
        cookieKey: `nsuts.cookie.${host}`,
    };
}

/**
 * Perform logout: clear credentials and refresh UI state.
 * Does not show user notifications.
 */
export async function performLogout(
    context: ExtensionContext,
    options?: { refreshTree?: boolean }
): Promise<void> {
    const refreshTree = options?.refreshTree ?? true;

    // Delete per-host credentials first
    const { emailKey, passwordKey, cookieKey } = getCurrentHostSecretKeys();

    const keys = await context.secrets.keys();
    for (const key of [emailKey, passwordKey, cookieKey]) {
        if (keys.includes(key)) {
            await context.secrets.delete(key);
        }
    }
    
    // Fallback: delete legacy keys
    if (keys.includes("nsuts.email")) {
        await context.secrets.delete("nsuts.email");
    }
    if (keys.includes("nsuts.password")) {
        await context.secrets.delete("nsuts.password");
    }
    if (keys.includes("nsuts.cookie")) {
        await context.secrets.delete("nsuts.cookie");
    }
    
    await commands.executeCommand("setContext", "nsuts.authorized", false);
    if (refreshTree) {
        await commands.executeCommand("nsuts.refresh_task_tree");
    }
}

export function getLogoutHandler(context: ExtensionContext) {
    return async function () {
        await performLogout(context);
        window.showInformationMessage("You're logged out");
    };
}
