import { StringSelectMenuInteraction } from 'discord.js';
import { Bot } from '../bot';

export interface SelectMenuData {
    name: string;
}

export abstract class SelectMenu {
    data: SelectMenuData;

    constructor (data: SelectMenuData) {
        this.data = data;
    }

    getName() {
        return this.data.name;
    }

    abstract execute(bot: Bot, interaction: StringSelectMenuInteraction, values: string[], ...args: string[]): void;
}
