export class TaskTemplate {
    static getHtml(tasksHtml: string): string {
        const css = this.getCssContent();
        const js = this.getJsContent();
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${css}</style>
            </head>
            <body>
                <div class="header">
                    <h1>📋 Выбор задачи</h1>
                    <div class="subtitle">Выберите задачу для решения</div>
                </div>

                <div class="olympiads-container">
                    ${tasksHtml || '<div class="no-olympiads">Нет доступных задач</div>'}
                </div>

                <div class="actions">
                    <button id="backBtn" class="back-btn">← Назад</button>
                    <button id="refreshBtn" class="refresh-btn">🔄 Обновить</button>
                </div>

                <script>${js}</script>
            </body>
            </html>
        `;
    }

    private static getCssContent(): string {
        return `
            :root {
                --container-padding: 15px;
                --input-width: 280px;
                --border-radius: 6px;
            }

            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                padding: var(--container-padding);
                background-color: var(--vscode-editor-background);
                color: var(--vscode-foreground);
                margin: 0;
            }

            .account-info {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
                background-color: var(--vscode-panel-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: var(--border-radius);
            }

            .account-info h1 {
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 10px 0;
                color: var(--vscode-foreground);
            }

            .email {
                color: var(--vscode-descriptionForeground);
                font-size: 13px;
                margin: 0;
            }

            .header {
                text-align: center;
                margin-bottom: 20px;
            }

            h1 {
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 5px 0;
                color: var(--vscode-foreground);
            }

            .subtitle {
                color: var(--vscode-descriptionForeground);
                font-size: 13px;
            }

            .task-btn {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                padding: 8px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                width: var(--input-width);
                max-width: 100%;
                margin-top: 10px;
            }

            .task-btn:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .task-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .tour-btn {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                padding: 8px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                width: var(--input-width);
                max-width: 100%;
                margin-top: 10px;
            }

            .tour-btn:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .tour-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .olympiads-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 20px;
            }

            .olympiad-btn {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                padding: 12px 15px;
                font-size: 13px;
                cursor: pointer;
                text-align: left;
                transition: background-color 0.2s;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .olympiad-btn:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .olympiad-name {
                font-weight: 600;
                flex: 1;
            }

            .olympiad-status {
                font-size: 11px;
                opacity: 0.8;
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                padding: 2px 6px;
                border-radius: 10px;
            }

            .no-olympiads {
                text-align: center;
                color: var(--vscode-descriptionForeground);
                padding: 20px;
            }

            .actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .primary-btn {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                padding: 10px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
            }

            .primary-btn:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .secondary-btn {
                background-color: transparent;
                color: var(--vscode-button-secondaryForeground);
                border: 1px solid var(--vscode-button-border);
                border-radius: var(--border-radius);
                padding: 8px 16px;
                font-size: 12px;
                cursor: pointer;
                width: 100%;
            }

            .secondary-btn:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            .back-btn {
                background-color: transparent;
                color: var(--vscode-button-secondaryForeground);
                border: 1px solid var(--vscode-button-border);
                border-radius: var(--border-radius);
                padding: 8px 16px;
                font-size: 12px;
                cursor: pointer;
            }

            .back-btn:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            .refresh-btn {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                padding: 8px 16px;
                font-size: 12px;
                cursor: pointer;
            }

            .refresh-btn:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
        `;
    }

    private static getJsContent(): string {
        return `
            const vscode = acquireVsCodeApi();
            
            document.querySelectorAll('.task-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const taskId = btn.getAttribute('data-id');
                    const taskName = btn.getAttribute('data-name');
                    
                    vscode.postMessage({ 
                        command: 'selectTask', 
                        taskId, 
                        taskName 
                    });
                });
            });

            const backBtn = document.getElementById('backBtn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'showTour' });
                });
            }

            const refreshBtn = document.getElementById('refreshBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'showTasks' });
                });
            }

            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'setupBackButton':
                        document.getElementById('backBtn')?.addEventListener('click', () => {
                            vscode.postMessage({ command: 'showTour' });
                        });
                        break;
                }
            });
        `;
    }
}