/* global bots:readable config:readable */
const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List the players on the Minecraft server.')
        .addStringOption((option) =>
            option.setName('server')
                .setDescription('The server to list players on')
                .setAutocomplete(true)
                .setRequired(true)),
    async execute(interaction) {
        if (interaction.options.getString('server') === 'all') {
            // max 25 fields per embed
            const embeds = [];
            let embed = new EmbedBuilder()
                .setTitle('Players on all servers');
            bots.forEach((bot) => {
                if (embed.fields.length >= 25) {
                    embeds.push(embed);
                    embed = new EmbedBuilder();
                }
                embed.addField(bot.username, bot.players.join('\n') || 'No players');
            });
            return interaction.reply({embeds: [embeds]});
        }
        const server = config.servers.find((server) => server.name === interaction.options.getString('server'));
        if (!server) {
            return interaction.reply('Server not found');
        }
        const bot = bots.find((bot) => bot.username === server.username);
        if (!bot) {
            return interaction.reply('You are not connected to this server');
        }
        const embeds = [];
        let embed = new EmbedBuilder()
            .setTitle('Players on ' + server.name);
        if (bot.players.length === 0) {
            embed.addField('No players', 'No players');
        }
        bot.players.forEach((player) => {
            if (embed.fields.length >= 25) {
                embeds.push(embed);
                embed = new EmbedBuilder();
            }
            embed.addField(player, player);
        });
        return interaction.reply({embeds: [embeds]});
    },
    async autocomplete(interaction) {
        const servers = config.servers.slice(0, 25).map((server) => ({
            name: server.name,
            value: server.name,
        }));
        servers.push({name: 'all', value: 'all'});
        return interaction.respond(servers);
    },
};