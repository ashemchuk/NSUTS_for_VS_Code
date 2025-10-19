import { NsutsViewProvider } from './interface';

export class ProviderManager {
    private static instance: ProviderManager;
    private provider: NsutsViewProvider | undefined;

    private constructor() {}

    public static getInstance(): ProviderManager {
        if (!ProviderManager.instance) {
            ProviderManager.instance = new ProviderManager();
        }
        return ProviderManager.instance;
    }

    public setProvider(provider: NsutsViewProvider): void {
        this.provider = provider;
    }

    public getProvider(): NsutsViewProvider | undefined {
        return this.provider;
    }

    public getCredentials(): [string, string] {
        if (!this.provider) {
            throw new Error('Provider not initialized. Please login first.');
        }
        return this.provider.getLoginAndPassword();
    }

    public hasCredentials(): boolean {
        if (!this.provider) {
            return false;
        }
        const [username, password] = this.getCredentials();
        return !!username && !!password;
    }
}