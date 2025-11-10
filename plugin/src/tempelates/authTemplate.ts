export class AuthTemplate {
    static getHtml(): string {
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
                background-color: green;
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

    private static getJsContent(): string {
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
}