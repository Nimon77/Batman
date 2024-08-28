/* global bots:readable */
const {SlashCommandBuilder} = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tps')
        .setDescription('Get the TPS of the Minecraft server.'),
    async execute(interaction) {
        await interaction.deferReply();
        var tps = {};
        bots.forEach((bot) => {
            bot.once('chat:tps', (tps) => {
                tps.push([bot.username, tps]);
            });
            bot.chat('/tps');
        });
        await wait(5000);
        tps.forEach((tp) => {
            tp[0] = config.servers.find((server) => server.username === tp[0]).name;
        });
        return interaction.followUp(tps.map((tp) => `- \`${tp[0]}\`: ${tp[1]}%`).join('\n'));
    },
};