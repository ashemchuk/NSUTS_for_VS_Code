import * as vscode from 'vscode';
import { getSavedCookie } from '../autorization/auth';
import { getNameUser } from '../autorization/user';
import { AuthHandler } from './authHandler';
import { OlympiadHandler } from './olympiadHandler';
import { NavigationHandler } from './navigationHandler';
import { AuthTemplate } from '../tempelates/authTemplate';
import { HomeTemplate } from '../tempelates/homeTemplate';

export class NsutsViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'nsuts-view';

    private webviewView: vscode.WebviewView | undefined;
    public currentUsername: string = '';
    public currentPassword: string = '';
    public nameUser: string = '';

    private authHandler: AuthHandler;
    private olympiadHandler: OlympiadHandler;
    private navigationHandler: NavigationHandler;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly context: vscode.ExtensionContext
    ) {
        this.authHandler = new AuthHandler(this);
        this.olympiadHandler = new OlympiadHandler(this);
        this.navigationHandler = new NavigationHandler(this);
    }

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
            webviewView.webview.html = HomeTemplate.getHtml(this.nameUser, this.currentUsername);
        } else {
            webviewView.webview.html = AuthTemplate.getHtml();
        }

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'login':
                    await this.authHandler.handleLogin(message.username, message.password);
                    break;
                case 'clear':
                    this.authHandler.clearCredentials();
                    break;
                case 'logout':
                    await this.authHandler.handleLogout();
                    break;
                case 'showOlympiads':
                    await this.olympiadHandler.handleShowOlympiads();
                    break;
                case 'selectOlympiad':
                    await this.olympiadHandler.handleSelectOlympiad(message.olympiadId, message.olympiadName);
                    break;
                case 'showTour':
                    await this.olympiadHandler.handleShowTour();
                    break;
                case 'selectTour':
                    await this.olympiadHandler.handleSelectTour(message.tourId, message.tourName);
                    break;
                case 'showTasks':
                    await this.olympiadHandler.handleShowTasks();
                    break;
                case 'backToMain':
                    await this.navigationHandler.handleBackToMain();
                    break;
            }
        });
    }

    public getLoginAndPassword(): [string, string] {
        return [this.currentUsername, this.currentPassword];
    }

    public getWebviewView(): vscode.WebviewView | undefined {
        return this.webviewView;
    }

    public getContext(): vscode.ExtensionContext {
        return this.context;
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

    public setupClearButton() {
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'setupClearButton'
            });
        }
    }

    public setupRetryButton() {
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'setupRetryButton'
            });
        }
    }

    public setupBackButton() {
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'setupBackButton'
            });
        }
    }
}