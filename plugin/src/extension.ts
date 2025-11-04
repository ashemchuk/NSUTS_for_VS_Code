import * as vscode from "vscode";
import { NsutsViewProvider } from "./handlers/viewProvider";
import {
  getOlympiads,
  enterOlympiad,
  getTours,
  enterTour,
} from "./autorization/olimpiads";
import { getTasks } from "./autorization/tasks";

export function activate(context: vscode.ExtensionContext) {
  const provider = new NsutsViewProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      NsutsViewProvider.viewType,
      provider
    )
  );

  const selectOlympiadCommand = vscode.commands.registerCommand(
    "nsuts.selectOlympiad",
    async () => {
      const olympiads = await getOlympiads(context);

      if (olympiads.length === 0) {
        vscode.window.showInformationMessage("📚 Олимпиады не найдены");
        return;
      }

      const items = olympiads.map((olympiad) => ({
        label: olympiad.title,
        description: `ID: ${olympiad.id} | Туров: ${olympiad.tours}`,
        olympiad: olympiad,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Выберите олимпиаду",
      });

      if (selected) {
        const success = await enterOlympiad(context, selected.olympiad.id);
        if (success) {
          vscode.window.showInformationMessage(
            `✅ Вошли в олимпиаду: ${selected.label}`
          );
        } else {
          vscode.window.showErrorMessage("❌ Не удалось войти в олимпиаду");
        }
      }
    }
  );

  const selectTourCommand = vscode.commands.registerCommand(
    "nsuts.selectTour",
    async () => {
      const tours = await getTours(context);

      if (tours.length === 0) {
        vscode.window.showInformationMessage(
          "📝 Туры не найдены. Сначала выберите олимпиаду."
        );
        return;
      }

      const items = tours.map((tour) => ({
        label: tour.title,
        description: `ID: ${tour.id}`,
        tour: tour,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Выберите тур",
      });

      if (selected) {
        const success = await enterTour(context, selected.tour.id);
        if (success) {
          vscode.window.showInformationMessage(
            `✅ Вошли в тур: ${selected.label}`
          );
        } else {
          vscode.window.showErrorMessage("❌ Не удалось войти в тур");
        }
      }
    }
  );

  const showTasksCommand = vscode.commands.registerCommand(
    "nsuts.showTasks",
    async () => {
      const tasks = await getTasks(context);

      if (tasks.length === 0) {
        vscode.window.showInformationMessage(
          "📝 Задачи не найдены или нет активного тура"
        );
        return;
      }

      const items = tasks.map((task) => ({
        label: task.title,
        description: `ID: ${task.id}`,
        task: task,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Выберите задачу",
      });

      if (selected) {
        vscode.window.showInformationMessage(
          `Выбрана задача: ${selected.label}`
        );
      }
    }
  );

  context.subscriptions.push(selectOlympiadCommand);
  context.subscriptions.push(selectTourCommand);
  context.subscriptions.push(showTasksCommand);
}
