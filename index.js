const { Client, GatewayIntentBits, Partials } = require('discord.js');
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(q) {
  return new Promise(r => rl.question(q, r));
}

(async () => {
  const token = await ask('Token do bot: ');
  const servidorId = await ask('ID do servidor que vai ser clonado: ');
  const destinoId = await ask('ID do servidor destino: ');

  const bot = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
  });

  bot.once('ready', async () => {
    console.log(`Bot conectado como ${bot.user.tag}`);

    const servidorOrigem = await bot.guilds.fetch(servidorId);
    const servidorDestino = await bot.guilds.fetch(destinoId);

    const canaisOrigem = await servidorOrigem.channels.fetch();
    const categorias = canaisOrigem.filter(c => c.type === 4); // 4 = Categoria

    for (const [id, categoria] of categorias) {
      const novaCategoria = await servidorDestino.channels.create({
        name: categoria.name,
        type: 4,
        position: categoria.rawPosition
      });

      const canaisTexto = canaisOrigem.filter(
        c => c.parentId === id && c.type === 0
      );

      for (const [canalId, canal] of canaisTexto) {
        const nomeGerado = `${canal.name}-${Math.floor(Math.random() * 999999999)}`;
        const newChan = await servidorDestino.channels.create({
          name: nomeGerado,
          type: 0,
          parent: novaCategoria.id,
          position: canal.rawPosition
        });

        const mensagens = await canal.messages.fetch({ limit: 100 });
        const mensagensOrdem = [...mensagens.values()].reverse();

        for (const msg of mensagensOrdem) {
          const content = msg.content?.trim() || '';
          let arquivos = [];

          if (msg.attachments.size > 0) {
            for (const a of msg.attachments.values()) {
              try {
                const response = await axios.get(a.url, { responseType: 'arraybuffer' });
                arquivos.push({ attachment: Buffer.from(response.data), name: a.name || 'file' });
              } catch {
                console.log('⚠️ Falha ao baixar:', a.url);
              }
            }
          }

          try {
            if (content.length > 0 || arquivos.length > 0) {
              await newChan.send({
                content: content.length > 0 ? content : undefined,
                files: arquivos.length > 0 ? arquivos : undefined
              });
            }
          } catch (e) {
            console.log(`⚠️ Erro ao enviar mensagem: ${e.message}`);
          }

          await new Promise(r => setTimeout(r, 1200));
        }

        console.log(`✅ Canal clonado: ${canal.name}`);
      }

      console.log(`=== Categoria clonada: ${categoria.name} ===`);
    }

    console.log('✅ Clonagem completa!');
    process.exit();
  });

  bot.login(token);
})();
