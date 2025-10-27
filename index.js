const fs = require("fs");
const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.config = config;
client.commands = new Collection();

// Komutları yükle
const commandFiles = fs.readdirSync("./komutlar").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./komutlar/${file}`);
  client.commands.set(command.name, command);
  console.log(`[KOMUT YÜKLENDİ] ${command.name}`);
}

// BOT READY
client.once("ready", () => {
  console.log(`${client.user.tag} aktif!`);

  // Sesli kanala bağlan
  const channel = client.channels.cache.get("SESLİ-KANAL-ID");
  if (channel && channel.isVoiceBased()) {
    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });
    console.log(`🔊 Sesli kanala bağlandı: ${channel.name}`);
  }
});

// MESAJ OLAYI (Komut + Küfür/Reklam engel)
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const prefix = config.prefix;

  // Komut kontrolü
  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    try {
      await command.execute(client, message, args);
    } catch (err) {
      console.error(err);
      message.reply("Komutu çalıştırırken bir hata oluştu!");
    }
    return;
  }

  // Küfür ve reklam engel
  const küfürler = ["orospu","ananı sikerim","porno", "sik", "yarrak"];
  const reklamlar = ["discord.gg/", "http://", "https://", "www."];

  if (küfürler.some(k => message.content.toLowerCase().includes(k))) {
    await message.delete().catch(() => {});
    message.channel.send({ content: `${message.author}, küfür kullanamazsın!` }).then(m => setTimeout(() => m.delete(), 5000));
    return;
  }

  if (reklamlar.some(r => message.content.toLowerCase().includes(r))) {
    await message.delete().catch(() => {});
    message.channel.send({ content: `${message.author}, reklam yapamazsın!` }).then(m => setTimeout(() => m.delete(), 5000));
    const reklamLog = client.channels.cache.get(config.channels.reklamLog);
    if (reklamLog) {
      const embed = new EmbedBuilder()
        .setTitle("Reklam Engellendi")
        .setDescription(`**Kullanıcı:** ${message.author.tag}\n**Mesaj:** ${message.content}\n**Kanal:** ${message.channel}`)
        .setColor("Orange")
        .setTimestamp();
      reklamLog.send({ embeds: [embed] });
    }
    return;
  }
});

// MESAJ LOG
client.on("messageDelete", async (message) => {
  if (message.partial) {
    try { await message.fetch(); } catch { return; }
  }
  if (!message.author || message.author.bot) return;

  const log = client.channels.cache.get(config.channels.messageLog);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setTitle("Mesaj Silindi")
    .setDescription(`**Kullanıcı:** ${message.author.tag}\n**Kanal:** ${message.channel}\n**Mesaj:** ${message.content || "Embed/Medya"}`)
    .setColor("Red")
    .setTimestamp();

  log.send({ embeds: [embed] });
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (oldMessage.partial) { try { await oldMessage.fetch(); } catch { return; } }
  if (newMessage.partial) { try { await newMessage.fetch(); } catch { return; } }
  if (!oldMessage.author || oldMessage.author.bot) return;

  const log = client.channels.cache.get(config.channels.messageLog);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setTitle("Mesaj Düzenlendi")
    .setDescription(`**Kullanıcı:** ${oldMessage.author.tag}\n**Kanal:** ${oldMessage.channel}\n**Eski Mesaj:** ${oldMessage.content || "Embed/Medya"}\n**Yeni Mesaj:** ${newMessage.content || "Embed/Medya"}`)
    .setColor("Orange")
    .setTimestamp();

  log.send({ embeds: [embed] });
});

// KANAL LOG
client.on("channelCreate", channel => {
  const log = client.channels.cache.get(config.channels.channelLog);
  if (!log) return;
  const embed = new EmbedBuilder()
    .setTitle("Kanal Oluşturuldu")
    .setDescription(`**Kanal:** ${channel.name}\n**Tip:** ${channel.type}`)
    .setColor("Green")
    .setTimestamp();
  log.send({ embeds: [embed] });
});

client.on("channelDelete", channel => {
  const log = client.channels.cache.get(config.channels.channelLog);
  if (!log) return;
  const embed = new EmbedBuilder()
    .setTitle("Kanal Silindi")
    .setDescription(`**Kanal:** ${channel.name}\n**Tip:** ${channel.type}`)
    .setColor("Red")
    .setTimestamp();
  log.send({ embeds: [embed] });
});

// ROL LOG
client.on("roleCreate", role => {
  const log = client.channels.cache.get(config.channels.roleLog);
  if (!log) return;
  const embed = new EmbedBuilder()
    .setTitle("Rol Oluşturuldu")
    .setDescription(`**Rol:** ${role.name}\n**ID:** ${role.id}`)
    .setColor("Green")
    .setTimestamp();
  log.send({ embeds: [embed] });
});

client.on("roleDelete", role => {
  const log = client.channels.cache.get(config.channels.roleLog);
  if (!log) return;
  const embed = new EmbedBuilder()
    .setTitle("Rol Silindi")
    .setDescription(`**Rol:** ${role.name}\n**ID:** ${role.id}`)
    .setColor("Red")
    .setTimestamp();
  log.send({ embeds: [embed] });
});

client.on("roleUpdate", (oldRole, newRole) => {
  const log = client.channels.cache.get(config.channels.roleLog);
  if (!log) return;
  const embed = new EmbedBuilder()
    .setTitle("Rol Güncellendi")
    .setDescription(`**Eski Rol:** ${oldRole.name}\n**Yeni Rol:** ${newRole.name}`)
    .setColor("Orange")
    .setTimestamp();
  log.send({ embeds: [embed] });
});

client.login(config.token);
