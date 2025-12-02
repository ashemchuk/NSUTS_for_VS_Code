import { commands, ExtensionContext, window } from "vscode";
import { client } from "../api/client";
export function getLogoutHandler(context: ExtensionContext) {
    return async function () {
        if ("nsuts.email" in (await context.secrets.keys())) {
            await context.secrets.delete("nsuts.email");
        }
        if ("nsuts.password" in (await context.secrets.keys())) {
            await context.secrets.delete("nsuts.password");
        }
        if ("nsuts.cookie" in (await context.secrets.keys())) {
            await context.secrets.delete("nsuts.cookie");
        }
        window.showInformationMessage("You're logged out");
        await client.POST("/logout");
        await commands.executeCommand("setContext", "nsuts.authorized", false);
    };
}
