/* global bots:readable */
const {SlashCommandBuilder} = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tps')
        .setDescription('Get the TPS of the Minecraft server.'),
    async execute(interaction) {
        await interaction.deferReply();
        tps_list = [];
        bots.forEach((bot) => {
            bot.once('chat:tps', (tps) => {
                tps_list.push([bot.username, tps]);
            });
            bot.chat('/tps');
        });
        await wait(5000);
        tps_list.sort((a, b) => b[1] - a[1]);
        tps_list.forEach((tps) => {
            tps[0] = config.servers.find((server) => server.username === tps[0]).name;
        });
        return interaction.followUp(tps_list.map((tps) => `- \`${tps[0]}\`: ${tps[1]}%`).join('\n'));
    },
};