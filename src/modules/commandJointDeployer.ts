import { REST, Routes } from 'discord.js';
import { Base, Initializable } from '../base';

export class CommandJointDeployer extends Base implements Initializable<never> {
    initialize() {
        this.jointDeploy();

        return true;
    }
    
    async jointDeploy() {
        const commands = this.bot.commands.deployCommands();
        const contextMenus = this.bot.contextMenus.deployContextMenus();

        const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
        await rest.put(
            Routes.applicationCommands(this.bot.clientId),
            { body: [...commands, ...contextMenus] }
        );
    }
}