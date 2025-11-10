import { login, logout } from '../autorization/auth';
import { getNameUser } from '../autorization/user';
import { AuthTemplate } from '../tempelates/authTemplate';
import { HomeTemplate } from '../tempelates/homeTemplate';

export class AuthHandler {
    constructor(private provider: any) {}

    async handleLogin(username: string, password: string) {
        if (!this.provider.getWebviewView()) return;

        this.provider.updateWebviewContent(`
            <div class="status-container">
                <div class="loading">🔄 Вход как ${username}...</div>
                <div class="hint">Пожалуйста, подождите, пока мы подключаемся к NSUTS</div>
            </div>
        `);

        try {
            const success = await login(this.provider.getContext(), username, password);
            
            if (success) {
                this.provider.currentUsername = username;
                this.provider.currentPassword = password;
                this.provider.nameUser = (await getNameUser(this.provider.getContext()))?.toString() ?? '';
                
                
                this.provider.updateWebviewContent(`
                    <div class="status-container">
                        <div class="success">✅ Успешно вошли как ${username}</div>
                        <div class="hint">Вы теперь подключены к NSUTS</div>
                        <button id="clearBtn" class="secondary-btn">Выйти</button>
                    </div>
                `);
                this.provider.setupClearButton();
                this.provider.updateEntireWebviewHtml(HomeTemplate.getHtml(this.provider.nameUser, this.provider.currentUsername));
            } else {
                console.log('Login failed, showing error');
                this.provider.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Ошибка авторизации</div>
                        <div class="hint">Пожалуйста, проверьте свои учетные данные и попробуйте снова</div>
                        <button id="retryBtn" class="secondary-btn">Повторить</button>
                    </div>
                `);
                this.provider.setupRetryButton();
            }
        } catch (error) {
            console.error('Login exception:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.provider.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Connection error</div>
                    <div class="hint">${errorMessage}</div>
                    <button id="retryBtn" class="secondary-btn">Retry</button>
                </div>
            `);
            this.provider.setupRetryButton();
        }
    }

    clearCredentials() {
        this.provider.currentUsername = '';
        this.provider.currentPassword = '';
        this.provider.updateWebviewContent(`
            <div class="status-container">
                <div class="info">🔒 Пожалуйста, введите данные своей учётной записи NSUTS</div>
            </div>
        `);
    }

    async handleLogout() {
        try {
            await logout(this.provider.getContext());
        } finally {
            this.clearCredentials();
            this.provider.getWebviewView()?.webview.postMessage({ command: 'clearInputs' });
            this.provider.updateEntireWebviewHtml(AuthTemplate.getHtml());
        }
    }
}