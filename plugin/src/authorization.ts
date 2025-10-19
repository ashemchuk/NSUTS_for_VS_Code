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

export interface Task {
  id: string;
  title: string;
}

export interface SubmitInfo {
  tourTime: number;
  elapsedTime: number;
  isEnabled: number;
  queueModel: number;
  isInfinite: number;
  langs: Array<{id: string; title: string}>;
  tasks: Task[];
  submitLimits: Array<{taskId: number; submitsTotal: number; submitsLeft: number}>;
}

export async function getNameUser(context: vscode.ExtensionContext): Promise<String | null> {
  try {
    const cookie = getSavedCookie(context);
    if (!cookie) {
      return null;
    }

    const response = await axios.get(
      'https://fresh.nsuts.ru/nsuts-new/api/common/system_data',
      {
        headers: {
          'Cookie': cookie,
          'Referer': 'https://fresh.nsuts.ru/nsuts-new/olympiads',
        },
        httpsAgent,
      }
    );

    const html = response.data.name || null;
    if (response.data && response.data.user) {
        const user = response.data.user;
        const fullName = `${user.name} ${user.surname}`;
        return fullName;
    }

        return null;

  } catch (error: any) {
    console.error('Ошибка получения имени пользователя:', error);
    return null;
  }
}

export async function getOlympiads(context: vscode.ExtensionContext): Promise<any[]> {
  try {
    const cookie = getSavedCookie(context);
    if (!cookie) {
      vscode.window.showErrorMessage('❌ Не авторизованы.');
      return [];
    }

    const response = await axios.get(
      'https://fresh.nsuts.ru/nsuts-new/api/olympiads/list',
      {
        headers: {
          'Cookie': cookie,
          'Referer': 'https://fresh.nsuts.ru/nsuts-new/olympiads',
        },
        httpsAgent,
      }
    );

    return response.data.registeredTo || [];
  } catch (error: any) {
    console.error('Error fetching olympiads:', error);
    return [];
  }
}

export async function enterOlympiad(context: vscode.ExtensionContext, olympiadId: string): Promise<boolean> {
  try {
    const cookie = getSavedCookie(context);
    if (!cookie) {
      return false;
    }

    const response = await axios.post(
      'https://fresh.nsuts.ru/nsuts-new/api/olympiads/enter',
      { olympiad: olympiadId },
      {
        headers: {
          'Cookie': cookie,
          'Content-Type': 'application/json',
          'Referer': 'https://fresh.nsuts.ru/nsuts-new/olympiads',
        },
        httpsAgent,
      }
    );

    console.log('Enter olympiad response:', JSON.stringify(response.data));
    return response.data.entered === true;
  } catch (error: any) {
    console.error('Error entering olympiad:', error);
    return false;
  }
}

export async function getTours(context: vscode.ExtensionContext): Promise<any[]> {
  try {
    const cookie = getSavedCookie(context);
    if (!cookie) {
      return [];
    }

    const response = await axios.get(
      'https://fresh.nsuts.ru/nsuts-new/api/tours/list',
      {
        headers: {
          'Cookie': cookie,
          'Referer': 'https://fresh.nsuts.ru/nsuts-new/tours',
        },
        httpsAgent,
      }
    );

    return response.data.tours || [];
  } catch (error: any) {
    console.error('Error fetching tours:', error);
    return [];
  }
}

export async function enterTour(context: vscode.ExtensionContext, tourId: string): Promise<boolean> {
  try {
    const cookie = getSavedCookie(context);
    if (!cookie) {
      return false;
    }

    const response = await axios.get(
      `https://fresh.nsuts.ru/nsuts-new/api/tours/enter?tour=${tourId}`,
      {
        headers: {
          'Cookie': cookie,
          'Referer': 'https://fresh.nsuts.ru/nsuts-new/tours',
        },
        httpsAgent,
      }
    );

    return response.data.entered === true;
  } catch (error: any) {
    console.error('Error entering tour:', error);
    return false;
  }
}

export async function getTasks(context: vscode.ExtensionContext): Promise<Task[]> {
  try {
    const cookie = getSavedCookie(context);
    if (!cookie) {
      console.log('No cookie found');
      vscode.window.showErrorMessage('❌ Не авторизованы. Сначала выполните вход.');
      return [];
    }

    console.log('Fetching tasks with cookie:', cookie);

    const response = await axios.get<SubmitInfo>(
      'https://fresh.nsuts.ru/nsuts-new/api/submit/submit_info',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
          'Cookie': cookie,
          'Referer': 'https://fresh.nsuts.ru/nsuts-new/submit',
        },
        httpsAgent,
        validateStatus: (status) => status >= 200 && status < 500,
      }
    );

    console.log('Tasks response status:', response.status);
    console.log('Tasks response data:', JSON.stringify(response.data));

    if (response.status !== 200) {
      vscode.window.showErrorMessage(`❌ Ошибка сервера: ${response.status}`);
      return [];
    }

    if (response.data && response.data.tasks) {
      if (response.data.tasks.length === 0) {
        vscode.window.showWarningMessage('⚠️ Нет доступных задач. Возможно нужно войти в олимпиаду и выбрать тур на сайте.');
      }
      return response.data.tasks;
    }

    vscode.window.showWarningMessage('⚠️ Сервер не вернул задачи. Возможно нужно войти в олимпиаду.');
    return [];
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    console.error('Error details:', error.response?.data);
    vscode.window.showErrorMessage(`⚠️ Ошибка при получении списка задач: ${error.message}`);
    return [];
  }
}
