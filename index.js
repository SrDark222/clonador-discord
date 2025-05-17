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
  const origemId = await ask('ID do servidor que vai ser clonado: ');
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

    const origem = await bot.guilds.fetch(origemId);
    const destino = await bot.guilds.fetch(destinoId);
    const canaisOrigem = await origem.channels.fetch();
    const categorias = canaisOrigem.filter(c => c.type === 4);

    for (const [catId, categoria] of categorias) {
      const novaCategoria = await destino.channels.create({
        name: categoria.name,
        type: 4,
        position: categoria.rawPosition
      });

      const canaisTexto = canaisOrigem.filter(c => c.parentId === catId && c.type === 0);

      for (const [_, canal] of canaisTexto) {
        const nomeSeguro = `${canal.name}-${Math.floor(Math.random() * 99999999)}`;
        const novoCanal = await destino.channels.create({
          name: nomeSeguro,
          type: 0,
          parent: novaCategoria.id,
          position: canal.rawPosition
        });

        const mensagens = await canal.messages.fetch({ limit: 100 });
        const mensagensOrdenadas = [...mensagens.values()].reverse();

        for (const msg of mensagensOrdenadas) {
          let arquivos = [];

          if (msg.attachments.size > 0) {
            for (const anexo of msg.attachments.values()) {
              try {
                const resposta = await axios.get(anexo.url, { responseType: 'arraybuffer' });
                arquivos.push({ attachment: Buffer.from(resposta.data), name: anexo.name || 'arquivo.png' });
              } catch (erro) {
                console.log(`Erro ao baixar anexo: ${erro.message}`);
              }
            }
          }

          try {
            await novoCanal.send({
              content: msg.content || undefined,
              files: arquivos.length > 0 ? arquivos : undefined
            });
          } catch (erro) {
            console.log(`Erro ao clonar mensagem: ${erro.message}`);
          }

          await new Promise(r => setTimeout(r, 1000));
        }

        console.log(`✅ Canal clonado: ${canal.name}`);
      }

      console.log(`=== Categoria clonada: ${categoria.name} ===`);
    }

    console.log('✅ Tudo clonado com sucesso!');
    process.exit();
  });

  bot.login(token);
})();
