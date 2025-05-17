const Discord = require('discord.js-selfbot-v13');
const axios = require('axios');
const readline = require('readline');
const gradient = require('gradient-string');

const client = new Discord.Client();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));

(async () => {
  console.log(gradient.instagram('──── 『 CLONAGEM DE CATEGORIA E CANAIS 』 ────\n'));

  const token = await ask('SEU TOKEN: ');
  const idServerAlvo = await ask('ID DO SERVER ALVO: ');
  const idCategoriaAlvo = await ask('ID DA CATEGORIA DO SERVER ALVO (a copiar): ');
  const idServerDestino = await ask('ID DO SERVER DE DESTINO: ');
  const idCategoriaDestino = await ask('ID DA CATEGORIA DO SERVER DE DESTINO (onde os canais vão entrar): ');
  const novoNomeCategoriaDestino = await ask('NOVO NOME PARA A CATEGORIA DE DESTINO: ');

  client.login(token).catch(() => {
    console.log('❌ Token inválido.');
    process.exit();
  });

  client.on('ready', async () => {
    console.log(`Logado como ${client.user.tag}\n`);

    // Pega guilds
    const serverAlvo = await client.guilds.fetch(idServerAlvo).catch(() => null);
    const serverDestino = await client.guilds.fetch(idServerDestino).catch(() => null);

    if (!serverAlvo || !serverDestino) {
      console.log('❌ Não consegui acessar um dos servidores.');
      process.exit();
    }

    // Pega categoria do alvo e do destino
    const categoriaAlvo = serverAlvo.channels.cache.get(idCategoriaAlvo);
    if (!categoriaAlvo || categoriaAlvo.type !== 'GUILD_CATEGORY') {
      console.log('❌ Categoria alvo inválida.');
      process.exit();
    }

    const categoriaDestinoOriginal = serverDestino.channels.cache.get(idCategoriaDestino);
    if (!categoriaDestinoOriginal || categoriaDestinoOriginal.type !== 'GUILD_CATEGORY') {
      console.log('❌ Categoria destino inválida.');
      process.exit();
    }

    // Renomeia categoria destino pro nome escolhido
    await categoriaDestinoOriginal.setName(novoNomeCategoriaDestino).catch(() => {
      console.log('⚠️ Não foi possível renomear a categoria destino.');
    });

    // Pega canais dentro da categoria alvo (ordenados por posição)
    const canaisAlvo = serverAlvo.channels.cache
      .filter(c => c.parentId === idCategoriaAlvo)
      .sort((a, b) => a.position - b.position);

    console.log(`Clonando ${canaisAlvo.size} canais da categoria "${categoriaAlvo.name}" para a categoria "${novoNomeCategoriaDestino}"...`);

    for (const [id, canal] of canaisAlvo) {
      try {
        // Cria canal dentro da categoria destino (usando idCategoriaDestino)
        const newChan = await serverDestino.channels.create(canal.name, {
          type: canal.type,
          parent: idCategoriaDestino,
          topic: canal.topic || null,
          nsfw: canal.nsfw,
          rateLimitPerUser: canal.rateLimitPerUser || 0,
          position: canal.position // tenta manter a posição original
        });

        console.log(`✓ Canal clonado: ${canal.name}`);

        // Clonar até 100 mensagens do canal original (texto + arquivos)
        let mensagens = [];
        let lastID = null;
        while (mensagens.length < 100) {
          const opt = { limit: 50 };
          if (lastID) opt.before = lastID;
          const fetched = await canal.messages.fetch(opt);
          if (!fetched.size) break;
          mensagens = mensagens.concat(Array.from(fetched.values()));
          lastID = fetched.last().id;
        }

        mensagens = mensagens.slice(0, 100).reverse();

        for (const msg of mensagens) {
          let arquivos = [];
          if (msg.attachments.size) {
            for (const a of msg.attachments.values()) {
              try {
                const res = await axios.get(a.url, { responseType: 'arraybuffer' });
                const name = a.name || 'file.jpg';
                arquivos.push({ attachment: Buffer.from(res.data), name });
              } catch {
                console.log('⚠️ Erro baixando anexo:', a.url);
              }
            }
          }

          const content = msg.content || '';
          try {
            if (arquivos.length)
              await newChan.send({ content, files: arquivos });
            else if (content) await newChan.send(content);
          } catch {
            // ignora erro de envio
          }

          await new Promise(r => setTimeout(r, 1200)); // delay pra evitar rate limit
        }

        await new Promise(r => setTimeout(r, 1500)); // delay geral

      } catch (e) {
        console.log(`Erro clonando canal ${canal.name}: ${e.message}`);
      }
    }

    console.log('\nClonagem da categoria finalizada.');
    process.exit();
  });
})();
