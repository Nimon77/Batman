/* global bots:writable job:writable config:readable */
require('../../utils/instrument')
const Sentry = require("@sentry/node");
const {SlashCommandBuilder} = require('discord.js');
const mineflayer = require('mineflayer');
const wait = require('node:timers/promises').setTimeout;
import { CronJob } from 'cron';

function log(server, message) {
  console.log(`[${server.name}] ${message}`);
}

function convertAnsi4ToAnsi3(message) {
  // Remove ANSI reset code
  message = message.replace(/^\u001b\[0m/, '');

  // Define ANSI color code mapping
  const ansiColorMap = {
    '\u001b\\[1m': '', // Bold
    '\u001b\\[90m': '\u001b[30m', // Dark gray to Black
    '\u001b\\[91m': '\u001b[31m', // Light red to Red
    '\u001b\\[92m': '\u001b[32m', // Light green to Green
    '\u001b\\[93m': '\u001b[33m', // Yellow to Yellow
    '\u001b\\[94m': '\u001b[34m', // Light blue to Blue
    '\u001b\\[95m': '\u001b[35m', // Light magenta to Magenta
    '\u001b\\[96m': '\u001b[36m', // Light cyan to Cyan
    '\u001b\\[97m': '\u001b[37m', // White to White
    '\u001b\\[100m': '\u001b[40m', // Background Dark gray to Black
    '\u001b\\[101m': '\u001b[41m', // Background Light red to Red
    '\u001b\\[102m': '\u001b[42m', // Background Light green to Green
    '\u001b\\[103m': '\u001b[43m', // Background Yellow to Yellow
    '\u001b\\[104m': '\u001b[44m', // Background Light blue to Blue
    '\u001b\\[105m': '\u001b[45m', // Background Light magenta to Magenta
    '\u001b\\[106m': '\u001b[46m', // Background Light cyan to Cyan
    '\u001b\\[107m': '\u001b[47m', // Background White to White
  };

  // Replace ANSI color codes
  for (const code in ansiColorMap) {
    if (ansiColorMap.hasOwnProperty(code)) {
      message = message.replace(new RegExp(code, 'g'), ansiColorMap[code]);
    }
  }

  return message;
}

function convertAnsi24ToAnsi3(inputString) {
  const ansi24Regex = /\u001b\[38;2;(\d+);(\d+);(\d+)m/g;
  return inputString.replace(ansi24Regex, (match, r, g, b) => {
    // Convert RGB to ANSI 3-bit color
    const ansi3Color = convertRGBToAnsi3(parseInt(r), parseInt(g), parseInt(b));
    return `\u001b[${ansi3Color}m`;
  });
}

function convertRGBToAnsi3(red, green, blue) {
  // Determine ANSI 3-bit color code closest to the given RGB color
  const colorTable = [
    [0, 0, 0], // black
    [205, 0, 0], // red
    [0, 205, 0], // green
    [205, 205, 0], // yellow
    [0, 0, 238], // blue
    [205, 0, 205], // magenta
    [0, 205, 205], // cyan
    [229, 229, 229], // white
  ];

  let minDistance = Number.MAX_VALUE;
  let closestColor = 0;

  for (let i = 0; i < colorTable.length; i++) {
    const [r, g, b] = colorTable[i];
    const distance = Math.sqrt(
        Math.pow(r - red, 2) +
        Math.pow(g - green, 2) +
        Math.pow(b - blue, 2),
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = i;
    }
  }

  return closestColor + 30; // ANSI 3-bit color codes start from 30
}

function convertToAnsi3(inputString) {
  let outputString = convertAnsi24ToAnsi3(inputString);
  outputString = convertAnsi4ToAnsi3(outputString);
  return outputString;
}

function blacklistedMessage(message) {
  const blacklist = [
    '❤❤❤❤❤',
    'vient de voter pour le seveur',
    'Le site de vote Vote',
  ];
  for (let i = 0; i < blacklist.length; i++) {
    if (message.includes(blacklist[i])) {
      return true;
    }
  }
  return false;
}

function connectBot(server, interaction) {
  const chatChannel = interaction.guild.channels.cache.find(
    (channel) => channel.id === server.discord_channel_id,
  );

  log(server, 'Connecting...');
  chatChannel.send('Connecting to ' + server.name + '...');

  const bot = mineflayer.createBot({
    host: server.host,
    port: server.port,
    username: server.username,
    version: server.version || '1.18.2',
  });

  // bot.ready = false;

  bot.on('kicked', (reason) => {
    log(server, 'Kicked: ' + reason);
    reason = JSON.parse(reason);
    let message = reason.text;
    if (reason.extra) {
      for (let i = 0; i < reason.extra.length; i++) {
        if (reason.extra[i].extra) {
          for (let j = 0; j < reason.extra[i].extra.length; j++) {
            if (reason.extra[i].extra[j].text) {
              message += reason.extra[i].extra[j].text;
            }
          }
        }
      }
    }
    chatChannel.send(
        `❌ Kicked : \`\`\`${message}\`\`\``,
    );
    bot.end();
  });
  bot.on('end', () => {
    log(server, '❌ Disconnected');
    chatChannel.send('❌ Bot disconnected');
    bots.splice(bots.findIndex((b) => b.username === bot.username), 1);
  });
  bot.on('error', (error) => {
    Sentry.captureException(error, {extra: {server}});
    log(server, 'Error: ' + error);
  });

  let msg = '';
  let msgTimer;

  bot.on('message', (message) => {
    if (blacklistedMessage(message.toString())) return;
    log(server, message.toAnsi());
    clearTimeout(msgTimer);
    msg += convertToAnsi3(message.toAnsi()) + '\n';
    // only send if no message in 5 seconds
    msgTimer = setTimeout(() => {
      if (msg === '') return;
      const msgArray = msg.match(/[\s\S]{1,1950}/g);
      for (let i = 0; i < msgArray.length; i++) {
        chatChannel.send('```ansi\n' + msgArray[i] + '```');
      }
      msg = '';
    }, 10000);
  });

  bot.on('chat:bot_need_register', async function() {
    await bot.waitForChunksToLoad();
    await bot.waitForTicks(100);
    await bot.chat('/register ' + server.password + ' ' + server.password);
  });

  bot.on('chat:bot_need_login', async function() {
    await bot.waitForChunksToLoad();
    await bot.waitForTicks(100);
    await bot.chat('/login ' + server.password);
  });

  bot.on('chat:bot_connection_success', async function() {
    await bot.waitForChunksToLoad();
    await bot.waitForTicks(200);
    await bot.clickWindow(22, 0, 0);
    bot.removeChatPattern('bot_need_register');
    bot.removeChatPattern('bot_need_login');
    bot.removeChatPattern('bot_connection_success');
    bot.addChatPattern(
      'bot_console_tp',
      /Console vous a téléporté à spawn./,
    );
    // bot.ready = true;
  });

  bot.on('chat:bot_console_tp', async function() {
    bot.removeChatPattern('bot_console_tp');
    bot.addChatPattern(
        'bot_need_login',
        /» Connectez-vous à l'aide de la commande \/login Motdepasse/,
    );
    bot.addChatPattern(
        'bot_connection_success',
        /» La connexion a été effectuée avec succès !/,
    );
  });

  bot.once('spawn', () => {
    bot.addChatPattern(
        'bot_need_register',
        /» Inscrivez-vous sur le serveur avec la commande: \/register motdepasse motdepasse/,
    );
    bot.addChatPattern(
        'bot_need_login',
        /» Connectez-vous à l'aide de la commande \/login Motdepasse/,
    );
    bot.addChatPattern(
        'bot_connection_success',
        /» La connexion a été effectuée avec succès !/,
    );
  });

  // while (!bot.ready) {
  //   await wait(1000);
  // }

  return bot;
}

module.exports = {
  data: new SlashCommandBuilder()
      .setName('connect')
      .setDescription('Connect to the Minecraft server.')
      .addStringOption((option) =>
        option.setName('server')
            .setDescription('The server to connect to')
            .setAutocomplete(true)
            .setRequired(false)),
  async execute(interaction) {
    if (interaction.options.getString('server')) {
      const server = config.servers.find((server) => server.name === interaction.options.getString('server'));
      if (!server) {
        return interaction.reply('Server not found');
      }
      const bot = bots.find((bot) => bot.username === server.username);
      if (bot) {
        return interaction.reply('You are already connected to a server');
      }
      // append bot to bots
      bots.push(connectBot(server, interaction));
      return interaction.reply('Connecting to ' + server.name);
    }
    await interaction.deferReply('Connecting to the server...');
    job = new CronJob(config.reconnect_cron, async function() {
      for (let i = 0; i < config.servers.length; i++) {
        if (bots.find((bot) => bot.username === config.servers[i].username))
          continue;
        bots.push(connectBot(config.servers[i], interaction));
        await wait(5000);
      }
    }, null, true, 'Europe/Paris', null, true);
    return interaction.followUp('Connected to all servers');
  },
  async autocomplete(interaction) {
    const results = config.servers.slice(0, 25).map((server) => ({
      name: server.name,
      value: server.name,
    }));
    return interaction.respond(results);
  },
};
