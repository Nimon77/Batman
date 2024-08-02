/* global bots:writable */
const {SlashCommandBuilder} = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
  data: new SlashCommandBuilder()
      .setName('disconnect')
      .setDescription('Disconnect from valane')
      .addStringOption((option) =>
        option.setName('server')
            .setDescription('The server to disconnect from')
            .setAutocomplete(true)
            .setRequired(false)),
  async execute(interaction) {
    if (interaction.options.getString('server') !== null) {
      const server = config.servers.find((server) => server.name === interaction.options.getString('server'));
      if (!server) {
        return interaction.reply('Server not found');
      }
      const bot = bots.find((bot) => bot.start_username === server.username);
      if (!bot) {
        return interaction.reply('You are not connected to this server');
      }
      bot.quit();
      return interaction.reply('Disconnected from ' + server.name);
    }
    interaction.deferReply();
    tmp = bots;
    while (tmp.length > 0) {
      tmp[0].quit();
      tmp.shift();
      await wait(1000);
    }
    bots = [];
    return interaction.followUp('Disconnected from all servers');
  },
  async autocomplete(interaction) {
    const results = config.servers.slice(0, 25).map((server) => ({
      name: server.name,
      value: server.name,
    }));
    return interaction.respond(results);
  },
};