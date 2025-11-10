import axios from 'axios';
import https from 'https';
import * as vscode from 'vscode';
import { getSavedCookie } from "./auth";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

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