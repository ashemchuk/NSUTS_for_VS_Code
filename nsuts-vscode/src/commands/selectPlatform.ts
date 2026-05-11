import * as vscode from "vscode";
import { setBaseUrl, getBaseUrl } from "../config";
import { performLogout } from "./logout";

const PREDEFINED_URLS = [
    {
        label: "fresh.nsuts",
        description: "https://fresh.nsuts.ru/nsuts-new/api/",
        url: "https://fresh.nsuts.ru/nsuts-new/api/",
    },
    {
        label: "olympic.nsu",
        description: "https://olympic.nsu.ru/nsuts-new/api/",
        url: "https://olympic.nsu.ru/nsuts-new/api/",
    },
    {
        label: "Custom URL...",
        description: "Enter a custom base URL",
        url: null,
    },
];

export function getSelectPlatformHandler(context: vscode.ExtensionContext) {
    return async function () {
        const currentUrl = getBaseUrl();
        const items = PREDEFINED_URLS.map((item) => ({
            ...item,
            picked: item.url === currentUrl,
        }));

        const selected = await vscode.window.showQuickPick(items, {
            title: "Select NSUTS Platform",
            placeHolder: "Choose a platform or enter a custom URL",
        });

        if (!selected) {
            return;
        }

        let newUrl: string;
        if (selected.url) {
            newUrl = selected.url;
        } else {
            // Custom URL input
            const input = await vscode.window.showInputBox({
                prompt: "Enter the base URL of NSUTS API (e.g., https://example.com/nsuts-new/api/)",
                value: currentUrl,
                validateInput: (value) => {
                    try {
                        new URL(value);
                        return null;
                    } catch {
                        return "Please enter a valid URL";
                    }
                },
            });
            if (input === undefined) {
                return; // cancelled
            }
            newUrl = input;
        }

        if (newUrl === currentUrl) {
            vscode.window.showInformationMessage(
                `Platform is already set to ${newUrl}`
            );
            return;
        }

        // Logout before switching platforms to ensure clean state
        // but delay tree refresh until after baseUrl is switched.
        await performLogout(context, { refreshTree: false });

        await setBaseUrl(newUrl);
        vscode.window.showInformationMessage(
            `Platform changed to ${newUrl}. Please re-authenticate.`
        );

        await vscode.commands.executeCommand("nsuts.refresh_task_tree");

        // The client will automatically refresh on next use due to baseUrl tracking in getClient()
    };
}
