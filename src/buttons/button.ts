import { ButtonInteraction } from 'discord.js';
import { Bot } from '../bot';

export interface ButtonData {
    name: string;
}

export abstract class Button {
    data: ButtonData;

    constructor (data: ButtonData) {
        this.data = data;
    }

    getName() {
        return this.data.name;
    }

    abstract execute(bot: Bot, interaction: ButtonInteraction, ...args: string[]): void;
}