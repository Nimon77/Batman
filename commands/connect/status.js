/* global bots:readable config:readable */

const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get the status of the bot'),
    async execute(interaction) {
        let status = '';
        for (let i = 0; i < config.servers.length; i++) {
            const bot = bots.find((bot) => bot.username === config.servers[i].username);
            if (bot) {
                status += `- ✅ \`${bot.username}\`: Connected to \`${config.servers[i].name}\`\n`;
            } else {
                status += `- ❌ \`${config.servers[i].username}\`: Not connected to \`${config.servers[i].name}\`\n`;
            }
        }
        return interaction.reply(status);
    },
};