/* global bots:readable config:readable */
const {SlashCommandBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Say something in the Minecraft server.')
    .addStringOption((option) =>
      option.setName('server')
        .setDescription('The server to say in')
        .setAutocomplete(true)
        .setRequired(true))
    .addStringOption((option) =>
      option.setName('message')
        .setDescription('The message to say')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.options.getString('server') === 'all') {
      bots.forEach((bot) => {
        bot.chat(interaction.options.getString('message'));
      });
      return interaction.reply('Messages sent');
    }
    const server = config.servers.find((server) => server.name === interaction.options.getString('server'));
    if (!server) {
      return interaction.reply('Server not found');
    }
    const bot = bots.find((bot) => bot.username === server.username);
    if (!bot) {
      return interaction.reply('You are not connected to this server');
    }
    bot.chat(interaction.options.getString('message'));
    return interaction.reply('Message sent');
  },
  async autocomplete(interaction) {
    const servers = config.servers.slice(0, 25).map((server) => ({
      name: server.name,
      value: server.name,
    }));
    servers.push({name: 'all', value: 'all'});
    return interaction.respond(servers);
  }
};