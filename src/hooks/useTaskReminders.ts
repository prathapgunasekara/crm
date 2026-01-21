import { useEffect } from 'react';
import { useNotify } from 'ra-core';
import type { Task } from '../components/atomic-crm/types';

const REMINDERS_STORAGE_KEY = 'taskReminders';

type TaskReminder = Pick<Task, 'id' | 'text' | 'reminder_date'>;

const getStoredReminders = (): TaskReminder[] => {
    try {
        const storedReminders = localStorage.getItem(REMINDERS_STORAGE_KEY);
        return storedReminders ? JSON.parse(storedReminders) : [];
    } catch (error) {
        console.error('Error reading reminders from localStorage', error);
        return [];
    }
};

const storeReminders = (reminders: TaskReminder[]) => {
    try {
        localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    } catch (error) {
        console.error('Error saving reminders to localStorage', error);
    }
};

export const useTaskReminders = () => {
    const notify = useNotify();

    const scheduleReminder = (task: TaskReminder) => {
        if (!task.reminder_date) return;

        const reminderDate = new Date(task.reminder_date);
        const now = new Date();

        if (reminderDate > now) {
            const delay = reminderDate.getTime() - now.getTime();
            setTimeout(() => {
                notify(`Reminder: ${task.text}`, { type: 'info' });
                const reminders = getStoredReminders();
                const updatedReminders = reminders.filter(r => r.id !== task.id);
                storeReminders(updatedReminders);
            }, delay);
        }
    };

    const addReminder = (task: Task) => {
        if (!task.reminder_date) return;
        const newReminder: TaskReminder = {
            id: task.id,
            text: task.text,
            reminder_date: task.reminder_date,
        };
        const reminders = getStoredReminders();
        if (reminders.some(r => r.id === newReminder.id)) return;

        const updatedReminders = [...reminders, newReminder];
        storeReminders(updatedReminders);
        scheduleReminder(newReminder);
    };

    useEffect(() => {
        const reminders = getStoredReminders();
        const now = new Date();
        const futureReminders = reminders.filter(r => r.reminder_date && new Date(r.reminder_date) > now);
        storeReminders(futureReminders);
        futureReminders.forEach(scheduleReminder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { addReminder };
};
