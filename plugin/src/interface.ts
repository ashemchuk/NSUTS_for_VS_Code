import * as vscode from 'vscode';
import { ProviderManager } from './providerManager';    
import { login, logout, getSavedCookie, getNameUser, getOlympiads, enterOlympiad, getTours, enterTour, getTasks } from './authorization';


export class NsutsViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'nsuts-view';

    private webviewView: vscode.WebviewView | undefined;
    private currentUsername: string = '';
    private currentPassword: string = '';
    private nameUser: string = '';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly context: vscode.ExtensionContext
    ) {}

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this.webviewView = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        
        if (getSavedCookie(this.context)) {
            this.nameUser = (await getNameUser(this.context))?.toString() ?? '';
            webviewView.webview.html = this.getHtmlForHomeScreen(webviewView.webview);
        } else {
            webviewView.webview.html = this.getHtmlForAuthorization(webviewView.webview);
        }

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'login':
                    await this.handleLogin(message.username, message.password);
                    break;
                case 'clear':
                    this.clearCredentials();
                    break;
                case 'logout':
                    await this.handleLogout();
                    break;
                case 'showOlympiads':
                    await this.handleShowOlympiads();
                    break;
                case 'selectOlympiad':
                    await this.handleSelectOlympiad(message.olympiadId, message.olympiadName);
                    break;
                case 'showTour':
                    await this.handleShowTour();
                    break;
                case 'selectTour':
                    await this.handleSelectTour(message.tourId, message.tourName);
                    break;
                case 'showTasks':
                    await this.handleShowTasks();
                    break;
                case 'backToMain':
                    await this.handleBackToMain();
                    break;
            }
        });
    }

    public getLoginAndPassword(): [string, string] {
        return [this.currentUsername, this.currentPassword];
    }

    private async handleLogin(username: string, password: string) {
        if (!this.webviewView) return;

        this.updateWebviewContent(`
            <div class="status-container">
                <div class="loading">🔄 Вход как ${username}...</div>
                <div class="hint">Пожалуйста, подождите, пока мы подключаемся к NSUTS</div>
            </div>
        `);

        try {
            const success = await login(this.context, username, password);
            
            if (success) {
                this.currentUsername = username;
                this.currentPassword = password;
                this.nameUser = (await getNameUser(this.context))?.toString() ?? '';
                
                ProviderManager.getInstance().setProvider(this);
                
                this.updateWebviewContent(`
                    <div class="status-container">
                        <div class="success">✅ Успешно вошли как ${username}</div>
                        <div class="hint">Вы теперь подключены к NSUTS</div>
                        <button id="clearBtn" class="secondary-btn">Выйти</button>
                    </div>
                `);
                this.setupClearButton();
                this.updateEntireWebviewHtml(this.getHtmlForHomeScreen(this.webviewView.webview));
            } else {
                console.log('Login failed, showing error');
                this.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Ошибка авторизации</div>
                        <div class="hint">Пожалуйста, проверьте свои учетные данные и попробуйте снова</div>
                        <button id="retryBtn" class="secondary-btn">Повторить</button>
                    </div>
                `);
                this.setupRetryButton();
            }
        } catch (error) {
            console.error('Login exception:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Connection error</div>
                    <div class="hint">${errorMessage}</div>
                    <button id="retryBtn" class="secondary-btn">Retry</button>
                </div>
            `);
            this.setupRetryButton();
        }
    }
    private clearCredentials() {
        this.currentUsername = '';
        this.currentPassword = '';
        this.updateWebviewContent(`
            <div class="status-container">
                <div class="info">🔒 Пожалуйста, введите данные своей учётной записи NSUTS</div>
            </div>
        `);
    }

    private async handleLogout() {
        try {
            await logout(this.context);
        } finally {
            this.clearCredentials();
            this.webviewView?.webview.postMessage({ command: 'clearInputs' });
            this.updateEntireWebviewHtml(this.getHtmlForAuthorization(this.webviewView!.webview));
        }
    }

    private setupClearButton() {
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'setupClearButton'
            });
        }
    }

    private setupRetryButton() {
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'setupRetryButton'
            });
        }
    }

    public updateEntireWebviewHtml(html: string) {
        if (this.webviewView) {
            this.webviewView.webview.html = html;
        }
    }

    public updateWebviewContent(content: string) {
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'updateContent',
                data: content
            });
        }
    }

    private async handleShowOlympiads() {
        if (!this.webviewView) return;

        try {
            const olympiads = await getOlympiads(this.context);
            
            if (olympiads.length === 0) {
                this.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Нет доступных олимпиад</div>
                        <div class="hint">Вы не зарегистрированы ни на одну олимпиаду</div>
                    </div>
                `);
                return;
            }

            const items = olympiads.map(olympiad => ({
                label: olympiad.title,
                description: `ID: ${olympiad.id} | Туров: ${olympiad.tours}`,
                olympiad: olympiad
            }));
            
            const olympiadsHtml = items.map(item => `
                <button class="olympiad-btn" data-id="${item.olympiad.id}" data-name="${item.olympiad.name}">
                    <span class="olympiad-name">${item.label}</span>
                    <span class="olympiad-status">${item.olympiad.status || 'Доступна'}</span>
                </button>
            `).join('');

            this.updateEntireWebviewHtml(this.getHtmlForOlympiads(this.webviewView.webview, olympiadsHtml));
        } catch (error) {
            this.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Ошибка загрузки олимпиад</div>
                    <div class="hint">Попробуйте позже</div>
                </div>
            `);
        }
    }

    private async handleShowTour() {
        if (!this.webviewView) return;

        try {
            const tours = await getTours(this.context);

            if (tours.length === 0) {
                this.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Нет доступных туров</div>
                        <div class="hint">Вы не зарегистрированы ни на один тур</div>
                    </div>
                `);
                return;
            }

            const items = tours.map(tour => ({
                label: tour.title,
                description: `ID: ${tour.id}`,
                tour: tour
            }));

            const toursHtml = items.map(item => `
                <button class="tour-btn" data-id="${item.tour.id}" data-name="${item.tour.title}">
                    <span class="tour-name">${item.label}</span>
                </button>
            `).join('');

            this.updateEntireWebviewHtml(this.getHtmlForTours(this.webviewView.webview, toursHtml));
        } catch (error) {
            this.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Ошибка загрузки туров</div>
                    <div class="hint">Попробуйте позже</div>
                </div>
            `);
        }
    }

    private async handleShowTasks() {
        if (!this.webviewView) return;

        try {
            const tasks = await getTasks(this.context);

            if (tasks.length === 0) {
                this.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Нет доступных задач</div>
                        <div class="hint">Вы не зарегистрированы ни на одну задачу</div>
                    </div>
                `);
                return;
            }

            const items = tasks.map(task => ({
                label: task.title,
                description: `ID: ${task.id}`,
                task: task
            }));

            const tasksHtml = items.map(item => `
                <button class="task-btn" data-id="${item.task.id}" data-name="${item.task.title}">
                    <span class="task-name">${item.label}</span>
                </button>
            `).join('');

            this.updateEntireWebviewHtml(this.getHtmlForTasks(this.webviewView.webview, tasksHtml));
        } catch (error) {
            this.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Ошибка загрузки олимпиад</div>
                    <div class="hint">Попробуйте позже</div>
                </div>
            `);
        }
    }

    private async handleSelectOlympiad(olympiadId: string, olympiadName: string) {
        if (!this.webviewView) return;

        try {
            const success = await enterOlympiad(this.context, olympiadId);
            
            if (success) {
                await this.context.globalState.update('current_olympiad', {
                    id: olympiadId,
                    name: olympiadName
                });
                
                await this.handleShowTour();
            } else {
                this.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Не удалось войти в олимпиаду</div>
                        <button id="backBtn" class="secondary-btn">Назад</button>
                    </div>
                `);
                this.setupBackButton();
            }
        } catch (error) {
            this.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Ошибка при входе в олимпиаду</div>
                    <button id="backBtn" class="secondary-btn">Назад</button>
                </div>
            `);
            this.setupBackButton();
        }
    }

    private async handleSelectTour(tourId: string, tourName: string) {
        if (!this.webviewView) return;

        try {
            const success = await enterTour(this.context, tourId);
            
            if (success) {
                await this.context.globalState.update('current_tour', {
                    id: tourId,
                    name: tourName
                });
                
                await this.handleShowTasks();
            } else {
                this.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Не удалось войти в тур</div>
                        <button id="backBtn" class="secondary-btn">Назад</button>
                    </div>
                `);
                this.setupBackButton();
            }
        } catch (error) {
            this.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Ошибка при входе в тур</div>
                    <button id="backBtn" class="secondary-btn">Назад</button>
                </div>
            `);
            this.setupBackButton();
        }
    }

    private async handleBackToMain() {
        if (this.webviewView) {
            this.updateEntireWebviewHtml(this.getHtmlForHomeScreen(this.webviewView.webview));
        }
    }

    private setupBackButton() {
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'setupBackButton'
            });
        }
    }

    private getHtmlForAuthorization(webview: vscode.Webview): string {
        const css = this.getCssContentForAuthorization();
        const js = this.getJsContentForAuthorization();
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${css}</style>
            </head>
            <body>
                <h1>🎓 NSUTS for VS Code</h1>
                
                <div class="form-container">
                    <div class="input-group">
                        <input type="email" id="username" placeholder="Email address" />
                    </div>
                    <div class="input-group">
                        <input type="password" id="password" placeholder="Password" />
                    </div>
                    
                    <button id="loginBtn" class="primary-btn">Авторизоваться на NSUTS</button>
                    
                    <div id="contentArea">
                        <div class="status-container">
                            <div class="info">🔒 Пожалуйста, введите свои учетные данные NSUTS</div>
                        </div>
                    </div>                    
                </div>

                <script>${js}</script>
            </body>
            </html>
        `;
    }

    private getHtmlForHomeScreen(webview: vscode.Webview): string {
        const css = this.getCssContentForHomeScreen();
        const js = this.getJsContentForHomeScreen();
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${css}</style>
            </head>
            <body>
                <div class="account-info">
                    <h1>👤 ${this.nameUser || 'Пользователь'}</h1>
                    <p class="email">${this.currentUsername}</p>
                </div>

                <div class="actions">
                    <button id="showOlympiadsBtn" class="primary-btn">🏆 Показать олимпиады</button>
                    <button id="logoutBtn" class="secondary-btn">🚪 Выйти</button>
                </div>

                <script>${js}</script>
            </body>
            </html>
        `;
    }

    private getHtmlForOlympiads(webview: vscode.Webview, olympiadsHtml: string): string {
        const css = this.getCssContentForHomeScreen();
        const js = this.getJsContentForHomeScreen();
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
                    <h1>🏆 Выбор олимпиады</h1>
                    <div class="subtitle">Выберите олимпиаду для участия</div>
                </div>

                <div class="olympiads-container">
                    ${olympiadsHtml || '<div class="no-olympiads">Нет доступных олимпиад</div>'}
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

    private getHtmlForTours(webview: vscode.Webview, toursHtml: string): string {
        const css = this.getCssContentForHomeScreen();
        const js = this.getJsContentForTourPage();
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
                    <h1>📝 Выбор тура</h1>
                    <div class="subtitle">Выберите тур для решения</div>
                </div>

                <div class="olympiads-container">
                    ${toursHtml || '<div class="no-olympiads">Нет доступных туров</div>'}
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

    private getHtmlForTasks(webview: vscode.Webview, tasksHtml: string): string {
        const css = this.getCssContentForHomeScreen();
        const js = this.getJsContentForTasksPage();

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
    
    private getCssContentForAuthorization(): string {
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

            h1 {
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 20px 0;
                text-align: center;
                color: var(--vscode-foreground);
            }

            .input-group {
                margin-bottom: 15px;
            }

            input {
                width: var(--input-width);
                max-width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--vscode-input-border);
                border-radius: var(--border-radius);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                font-size: 13px;
                box-sizing: border-box;
            }

            input:focus {
                outline: 1px solid var(--vscode-focusBorder);
                border-color: var(--vscode-focusBorder);
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
                width: var(--input-width);
                max-width: 100%;
                margin-top: 10px;
            }

            .primary-btn:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .primary-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .secondary-btn {
                background-color: transparent;
                color: var(--vscode-button-secondaryForeground);
                border: 1px solid var(--vscode-button-border);
                border-radius: var(--border-radius);
                padding: 8px 16px;
                font-size: 12px;
                cursor: pointer;
                margin-top: 10px;
            }

            .secondary-btn:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            .status-container {
                margin-top: 20px;
                padding: 15px;
                border-radius: var(--border-radius);
                background-color: var(--vscode-panel-background);
                border: 1px solid var(--vscode-panel-border);
                text-align: center;
            }

            .loading {
                color: var(--vscode-progressBar-background);
                font-weight: 600;
                margin-bottom: 5px;
            }

            .success {
                color: var(--vscode-testing-iconPassed);
                font-weight: 600;
                margin-bottom: 5px;
            }
            .error {
                color: var(--vscode-errorForeground);
                font-weight: 600;
                margin-bottom: 5px;
            }

            .info {
                color: var(--vscode-descriptionForeground);
                font-weight: 600;
            }

            .hint {
                color: var(--vscode-descriptionForeground);
                font-size: 12px;
                margin-top: 5px;
            }

            .form-container {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
        `;
    }

    private getCssContentForHomeScreen(): string {
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

    private getJsContentForAuthorization(): string {
        return `
            const vscode = acquireVsCodeApi();
                    
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const loginBtn = document.getElementById('loginBtn');
            const contentArea = document.getElementById('contentArea');
            const exitBtn = document.getElementById('logout');
            
            function updateLoginButton() {
                const hasCredentials = usernameInput.value && passwordInput.value;
                loginBtn.disabled = !hasCredentials;
            }
            
            loginBtn.addEventListener('click', () => {
                const username = usernameInput.value.trim();
                const password = passwordInput.value;
                
                if (!username || !password) {
                    return;
                }
                
                vscode.postMessage({ 
                    command: 'login', 
                    username, 
                    password 
                });
            });
            
            usernameInput.addEventListener('input', updateLoginButton);
            passwordInput.addEventListener('input', updateLoginButton);
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    loginBtn.click();
                }
            });
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    loginBtn.click();
                }
            });
            
            exitBtn.addEventListener('click', () => {
                vscode.postMessage({ 
                    command: 'logout'  
                });
            });
            
            updateLoginButton();
            usernameInput.focus();
        `;
    }

    private getJsContentForHomeScreen(): string {
        return `
        const vscode = acquireVsCodeApi();
        
        const showOlympiadsBtn = document.getElementById('showOlympiadsBtn');
        if (showOlympiadsBtn) {
            showOlympiadsBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'showOlympiads' });
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'logout' });
            });
        }

        document.querySelectorAll('.olympiad-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const olympiadId = btn.getAttribute('data-id');
                const olympiadName = btn.getAttribute('data-name');
                
                vscode.postMessage({ 
                    command: 'selectOlympiad', 
                    olympiadId, 
                    olympiadName 
                });
            });
        });

        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'backToMain' });
            });
        }

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'showOlympiads' });
            });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'setupBackButton':
                    document.getElementById('backBtn')?.addEventListener('click', () => {
                        vscode.postMessage({ command: 'backToMain' });
                    });
                    break;
            }
        });
    `;
    }

    private getJsContentForTourPage(): string {
        return `
        const vscode = acquireVsCodeApi();
        
        document.querySelectorAll('.tour-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tourId = btn.getAttribute('data-id');
                const tourName = btn.getAttribute('data-name');
                
                vscode.postMessage({ 
                    command: 'selectTour', 
                    tourId, 
                    tourName 
                });
            });
        });

        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'showOlympiads' });
            });
        }

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'showTour' });
            });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'setupBackButton':
                    document.getElementById('backBtn')?.addEventListener('click', () => {
                        vscode.postMessage({ command: 'showOlympiads' });
                    });
                    break;
            }
        });
    `;
    }

    private getJsContentForTasksPage(): string {
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