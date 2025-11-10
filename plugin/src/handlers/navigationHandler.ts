import { HomeTemplate } from '../tempelates/homeTemplate';

export class NavigationHandler {
    constructor(private provider: any) {}

    async handleBackToMain() {
        if (this.provider.getWebviewView()) {
            this.provider.updateEntireWebviewHtml(HomeTemplate.getHtml(this.provider.nameUser, this.provider.currentUsername));
        }
    }
}