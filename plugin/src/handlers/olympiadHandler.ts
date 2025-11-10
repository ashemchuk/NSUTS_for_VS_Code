import { getOlympiads, enterOlympiad, getTours, enterTour } from '../autorization/olimpiads';
import { getTasks } from '../autorization/tasks';
import { OlympiadTemplate } from '../tempelates/olympiadTemplate';
import { TourTemplate } from '../tempelates/tourTemplate';
import { TaskTemplate } from '../tempelates/taskTemplate';

export class OlympiadHandler {
    constructor(private provider: any) {}

    async handleShowOlympiads() {
        if (!this.provider.getWebviewView()) return;

        try {
            const olympiads = await getOlympiads(this.provider.getContext());
            
            if (olympiads.length === 0) {
                this.provider.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Нет доступных олимпиад</div>
                        <div class="hint">Вы не зарегистрированы ни на одну олимпиаду</div>
                    </div>
                `);
                return;
            }

            const items = olympiads.map(olympiad => ({
                label: olympiad.title,
                description: `ID: ${olympiad.id} | Туров: ${olympiad.tours}`,
                olympiad: olympiad
            }));
            
            const olympiadsHtml = items.map(item => `
                <button class="olympiad-btn" data-id="${item.olympiad.id}" data-name="${item.olympiad.name}">
                    <span class="olympiad-name">${item.label}</span>
                    <span class="olympiad-status">${item.olympiad.status || 'Доступна'}</span>
                </button>
            `).join('');

            this.provider.updateEntireWebviewHtml(OlympiadTemplate.getHtml(olympiadsHtml));
        } catch (error) {
            this.provider.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Ошибка загрузки олимпиад</div>
                    <div class="hint">Попробуйте позже</div>
                </div>
            `);
        }
    }

    async handleShowTour() {
        if (!this.provider.getWebviewView()) return;

        try {
            const tours = await getTours(this.provider.getContext());

            if (tours.length === 0) {
                this.provider.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Нет доступных туров</div>
                        <div class="hint">Вы не зарегистрированы ни на один тур</div>
                    </div>
                `);
                return;
            }

            const items = tours.map(tour => ({
                label: tour.title,
                description: `ID: ${tour.id}`,
                tour: tour
            }));

            const toursHtml = items.map(item => `
                <button class="tour-btn" data-id="${item.tour.id}" data-name="${item.tour.title}">
                    <span class="tour-name">${item.label}</span>
                </button>
            `).join('');

            this.provider.updateEntireWebviewHtml(TourTemplate.getHtml(toursHtml));
        } catch (error) {
            this.provider.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Ошибка загрузки туров</div>
                    <div class="hint">Попробуйте позже</div>
                </div>
            `);
        }
    }

    async handleShowTasks() {
        if (!this.provider.getWebviewView()) return;

        try {
            const tasks = await getTasks(this.provider.getContext());

            if (tasks.length === 0) {
                this.provider.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Нет доступных задач</div>
                        <div class="hint">Вы не зарегистрированы ни на одну задачу</div>
                    </div>
                `);
                return;
            }

            const items = tasks.map(task => ({
                label: task.title,
                description: `ID: ${task.id}`,
                task: task
            }));

            const tasksHtml = items.map(item => `
                <button class="task-btn" data-id="${item.task.id}" data-name="${item.task.title}">
                    <span class="task-name">${item.label}</span>
                </button>
            `).join('');

            this.provider.updateEntireWebviewHtml(TaskTemplate.getHtml(tasksHtml));
        } catch (error) {
            this.provider.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Ошибка загрузки олимпиад</div>
                    <div class="hint">Попробуйте позже</div>
                </div>
            `);
        }
    }

    async handleSelectOlympiad(olympiadId: string, olympiadName: string) {
        if (!this.provider.getWebviewView()) return;

        try {
            const success = await enterOlympiad(this.provider.getContext(), olympiadId);
            
            if (success) {
                await this.provider.getContext().globalState.update('current_olympiad', {
                    id: olympiadId,
                    name: olympiadName
                });
                
                await this.handleShowTour();
            } else {
                this.provider.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Не удалось войти в олимпиаду</div>
                        <button id="backBtn" class="secondary-btn">Назад</button>
                    </div>
                `);
                this.provider.setupBackButton();
            }
        } catch (error) {
            this.provider.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Ошибка при входе в олимпиаду</div>
                    <button id="backBtn" class="secondary-btn">Назад</button>
                </div>
            `);
            this.provider.setupBackButton();
        }
    }

    async handleSelectTour(tourId: string, tourName: string) {
        if (!this.provider.getWebviewView()) return;

        try {
            const success = await enterTour(this.provider.getContext(), tourId);
            
            if (success) {
                await this.provider.getContext().globalState.update('current_tour', {
                    id: tourId,
                    name: tourName
                });
                
                await this.handleShowTasks();
            } else {
                this.provider.updateWebviewContent(`
                    <div class="status-container">
                        <div class="error">❌ Не удалось войти в тур</div>
                        <button id="backBtn" class="secondary-btn">Назад</button>
                    </div>
                `);
                this.provider.setupBackButton();
            }
        } catch (error) {
            this.provider.updateWebviewContent(`
                <div class="status-container">
                    <div class="error">❌ Ошибка при входе в тур</div>
                    <button id="backBtn" class="secondary-btn">Назад</button>
                </div>
            `);
            this.provider.setupBackButton();
        }
    }
}