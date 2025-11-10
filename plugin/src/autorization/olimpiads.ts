import * as vscode from 'vscode';
import axios from 'axios';
import https from 'https';
import { getSavedCookie } from "./auth";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

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