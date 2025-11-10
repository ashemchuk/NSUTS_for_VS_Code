// @ts-nocheck
import axios from 'axios';
import https from 'https';
import * as vscode from 'vscode';
import { getSavedCookie } from './auth';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

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
