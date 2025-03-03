/* global bots:writable job:writable config:readable */
require('./utils/instrument')
const Sentry = require("@sentry/node");
const { Client, Collection, GatewayIntentBits, Events, REST, Routes, MessageFlags } = require('discord.js');
const path = require('path')
const fs = require('fs')
const YAML = require('yaml')

config = YAML.parse(fs.readFileSync('./config.yml', 'utf8'))

// console.log('config :>> ', config);

bots = [];
job = null;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  presence: {
    activities: [],
    status: 'dnd',
  },
});

const commands = new Collection()
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.discord.token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.size} application (/) commands.`);

    const data = await rest.put(
        Routes.applicationGuildCommands(config.discord.client_id, config.discord.guild_id),
        {body: commands.map((command) => command.data.toJSON())},
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
    Sentry.captureException(error);
  }
})();

var connected = false;

client.on(Events.InteractionCreate, async (interaction) => {
  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  if (interaction.isAutocomplete()) {
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      Sentry.captureException(error, {extra: {interaction}});
      return;
    }
  } else if (interaction.isCommand()) {
    try {
      await command.execute(interaction);
    } catch (error) {
      Sentry.captureException(error, {extra: {interaction}});
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral});
      } else {
        await interaction.reply({content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral});
      }
    }
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  const guild = c.guilds.cache.get(config.discord.guild_id);
  if (!guild) {
    console.error(`Guild ${config.discord.guild_id} not found.`);
    return;
  }
});

client.login(config.discord.token);
