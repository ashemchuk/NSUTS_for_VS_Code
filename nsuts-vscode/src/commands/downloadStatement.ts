import * as vscode from "vscode";
import { client } from "../api/client";
import { getBaseUrl } from "../config";

export function getDownloadStatementHandler(context: vscode.ExtensionContext) {
    return async (node: any) => {
        if (!node || !node.tourId) {
            return;
        }

        try {
            // Переходим в контекст тура
            await client.GET("/tours/enter", {
                params: { query: { tour: Number(node.tourId) } },
            });

            // Запрашиваем данные страницы
            const { data } = await client.GET("/news/page_info");
            const forTourData: any = data?.statements?.forTour;
            const statementId = Array.isArray(forTourData)
                ? forTourData[0]?.id
                : forTourData?.id;

            if (statementId) {
                // Determine cookie key based on current baseUrl host
                const baseUrl = getBaseUrl();
                const host = new URL(baseUrl).host;
                const cookieKey = `nsuts.cookie.${host}`;
                let cookie = await context.secrets.get(cookieKey);
                if (!cookie) {
                    // Fallback to legacy key
                    cookie = await context.secrets.get("nsuts.cookie");
                }

                // Construct URL using baseUrl
                const url = `${baseUrl.replace(/\/$/, "")}/news/tour_statement?id=${statementId}`;

                const response = await fetch(url, {
                    headers: {
                        Cookie: cookie || "",
                        "User-Agent": "VSCode-Extension",
                    },
                });

                if (!response.ok) {
                    vscode.window.showErrorMessage(
                        `Сервер ответил ошибкой: ${response.status}`
                    );
                    return;
                }

                const arrayBuffer = await response.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                // Проверка на PDF
                const isPdf =
                    uint8Array.length > 4 &&
                    uint8Array[0] === 0x25 && // %
                    uint8Array[1] === 0x50 && // P
                    uint8Array[2] === 0x44 && // D
                    uint8Array[3] === 0x46; // F

                if (!isPdf) {
                    const textDecode = new TextDecoder().decode(uint8Array);
                    console.log("Ответ сервера (не PDF):", textDecode);
                    vscode.window.showErrorMessage(
                        "Скачался не PDF-файл. Проверьте консоль отладки!"
                    );
                    return;
                }

                const saveUri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(
                        `Условия_тура_${node.tourId}.pdf`
                    ),
                    filters: { "PDF файлы": ["pdf"], "Все файлы": ["*"] },
                });

                if (saveUri) {
                    await vscode.workspace.fs.writeFile(saveUri, uint8Array);
                    const action = await vscode.window.showInformationMessage(
                        "Условия успешно скачаны!",
                        "Открыть файл"
                    );
                    if (action === "Открыть файл") {
                        vscode.env.openExternal(saveUri);
                    }
                }
            } else {
                vscode.window.showErrorMessage(
                    "В этом туре нет прикрепленного файла с условиями."
                );
            }
        } catch (e) {
            console.error(e);
            vscode.window.showErrorMessage(
                "Не удалось выполнить скачивание с сервера NSUTS."
            );
        }
    };
}
