import axios from 'axios';
import https from 'https';
import * as vscode from 'vscode';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, 
});

export async function login(
  context: vscode.ExtensionContext,
  email: string,
  password: string
): Promise<boolean> {
  try {
    await context.globalState.update('nsuts_session_cookie', undefined);
    
    vscode.window.showInformationMessage('🔐 Авторизация...');

    const requestBody = {
      email,
      password,
      method: 'internal',  
    };

    const response = await axios.post(
      'https://fresh.nsuts.ru/nsuts-new/api/login',
      requestBody,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
          'Content-Type': 'application/json',
          'Origin': 'https://fresh.nsuts.ru',
          'Referer': 'https://fresh.nsuts.ru/nsuts-new/login',
        },
        httpsAgent,
        withCredentials: true,
        validateStatus: (status) => status >= 200 && status < 500,
      }
    );

    if (response.status === 200 && response.data && response.data.success === true) {
      const cookies = response.headers['set-cookie'];
      
      if (cookies && cookies.length > 0) {
        const cookieString = cookies.map((c: string) => c.split(';')[0]).join('; ');

        await context.globalState.update('nsuts_session_cookie', cookieString);

        vscode.window.showInformationMessage('✅ Авторизация успешна!');
        return true;
      } else {
        vscode.window.showErrorMessage('❌ Ошибка: сервер не вернул cookie');
        return false;
      }
    }

    if (response.data && response.data.error) {
      vscode.window.showErrorMessage(`Ошибка авторизации: ${response.data.error}`);
      return false;
    }

    vscode.window.showErrorMessage('❌ Авторизация не удалась (неверный ответ сервера)');
    return false;
  } catch (error: any) {
    console.error('Login error:', error);
    vscode.window.showErrorMessage('⚠️ Ошибка при подключении к серверу');
    return false;
  }
}

export function getSavedCookie(context: vscode.ExtensionContext): string | undefined {
  return context.globalState.get<string>('nsuts_session_cookie');
}

export async function logout(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update('nsuts_session_cookie', undefined);
  vscode.window.showInformationMessage('🚪 Вы вышли из системы.');
}
