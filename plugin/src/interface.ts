import * as vscode from 'vscode';
import { ProviderManager } from './providerManager';    
import { login,logout,getSavedCookie,getNameUser,getOlympiads,getTours,getTasks } from './authorization';
import { get } from 'axios';

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

    resolveWebviewView(
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
            webviewView.webview.html = this.getHtmlForInfoAccount(webviewView.webview);
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
                // case 'selectOlympiadBtn':
                //     await this.handleEnterOlympiad();
                //     break;
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
                this.updateEntireWebviewHtml(this.getHtmlForInfoAccount(this.webviewView.webview));
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

    // private async handleEnterOlympiad() {
    //     const olympiadId = this.getCurrentOlympiadId();
    //     if (olympiadId) {
    //         await enterOlympiad(this.context, olympiadId);
    //     }
    // }

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

                    <button id="logout" class="exitBtn">Выйти</button>
                    
                </div>

                <script>${js}</script>
            </body>
            </html>
        `;
    }

    private getHtmlForInfoAccount(webview: vscode.Webview): string {
        const css = this.getCssContentForInfoAccount();
        const js = this.getJsContentForInfoAccount();
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${css}</style>
            </head>
            <body>
                <h1>${this.nameUser}</h1>

                <div class="function-container">
                    <button id="selectOlympiad" class="selectOlympiad">Выбрать олимпиаду</button>

                    <button id="selectTour" class="selectTour">Выбрать тур задач</button>

                    <button id="selectTask" class="selectTask">Выбрать задачу</button>

                    <button id="logout" class="exitBtn">Выйти</button>
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

            .exitBtn {
                background-color: #c90e0e;
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                padding: 10px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                width: var(--input-width);
                max-width: 30%;
                margin-top: 20px;        
                margin-left: auto;       
                margin-right: auto;  
            }

            .exitBtn:hover {
                background-color: #a00c0c;  
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

    private getCssContentForInfoAccount(): string {
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
                margin-top: 250px;
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

            .selectTask {
                background-color: #44ad07ff;  
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                padding: 10px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                width: var(--input-width);
                max-width: 100%;
                margin-top: 20px;        
                margin-left: auto;       
                margin-right: auto;  
            }

            .selectTask:hover {
                background-color: #2f7a03ff; 
            }

            .selectTour {
                background-color: #44ad07ff;  
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                padding: 10px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                width: var(--input-width);
                max-width: 100%;
                margin-top: 20px;        
                margin-left: auto;       
                margin-right: auto;  
            }

            .selectTour:hover {
                background-color: #2f7a03ff; 
            }

            .selectOlympiad {
                background-color: #44ad07ff;  
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                padding: 10px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                width: var(--input-width);
                max-width: 100%;
                margin-top: 20px;        
                margin-left: auto;       
                margin-right: auto;  
            }

            .selectOlympiad:hover {
                background-color: #2f7a03ff; 
            }

            .exitBtn {
                background-color: #c90e0e;
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                padding: 10px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                width: var(--input-width);
                max-width: 30%;
                margin-top: 20px;        
                margin-left: auto;       
                margin-right: auto;  
            }

            .exitBtn:hover {
                background-color: #a00c0c;  
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
            
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'updateContent':
                        contentArea.innerHTML = message.data;
                        break;
                    case 'setupClearButton':
                        document.getElementById('clearBtn')?.addEventListener('click', () => {
                            vscode.postMessage({ command: 'logout' });
                            usernameInput.value = '';
                            passwordInput.value = '';
                            updateLoginButton();
                        });
                        break;
                    case 'setupRetryButton':
                        document.getElementById('retryBtn')?.addEventListener('click', () => {
                            usernameInput.value = '';
                            passwordInput.value = '';
                            updateLoginButton();
                            contentArea.innerHTML = \`
                                <div class="status-container">
                                    <div class="info">🔒 Введите свои данные учетной записи NSUTS</div>
                                </div>
                            \`;
                        });
                        break;
                    case 'clearInputs':
                        usernameInput.value = '';
                        passwordInput.value = '';
                        updateLoginButton();
                        break;
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

    private getJsContentForInfoAccount(): string {
        return `
            const vscode = acquireVsCodeApi();
            
            const selectOlympiadBtn = document.getElementById('selectOlympiad');
            const selectTourBtn = document.getElementById('selectTour');
            const selectTaskBtn = document.getElementById('selectTask');
            const exitBtn = document.getElementById('logout');

            function updateSelectButtons() {
                const hasCredentials = usernameInput.value && passwordInput.value;
                selectOlympiadBtn.disabled = !hasCredentials;
                selectTourBtn.disabled = !hasCredentials;
                selectTaskBtn.disabled = !hasCredentials;
            }
            
            selectOlympiadBtn.addEventListener('click', () => {
                const olympiadId = getSelectedOlympiadId();
                if (olympiadId) {
                    vscode.postMessage({ command: 'enterOlympiad', olympiadId });
                }
            });

            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'updateContent':
                        contentArea.innerHTML = message.data;
                        break;
                    case 'setupClearButton':
                        document.getElementById('clearBtn')?.addEventListener('click', () => {
                            vscode.postMessage({ command: 'logout' });
                            usernameInput.value = '';
                            passwordInput.value = '';
                            updateLoginButton();
                        });
                        break;
                    case 'setupRetryButton':
                        document.getElementById('retryBtn')?.addEventListener('click', () => {
                            usernameInput.value = '';
                            passwordInput.value = '';
                            updateLoginButton();
                            contentArea.innerHTML = \`
                                <div class="status-container">
                                    <div class="info">🔒 Введите свои данные учетной записи NSUTS</div>
                                </div>
                            \`;
                        });
                        break;
                    case 'clearInputs':
                        usernameInput.value = '';
                        passwordInput.value = '';
                        updateLoginButton();
                        break;
                }
            });

            exitBtn.addEventListener('click', () => {
                vscode.postMessage({ 
                    command: 'logout'  
                });
            });

        `;
    }
}