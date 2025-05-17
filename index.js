const Discord = require('discord.js-selfbot-v13');
const axios = require('axios');
const readline = require('readline');
const gradient = require('gradient-string');

const client = new Discord.Client();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));

function gerarNomeUnico(nomeOriginal) {
  const sufixo = Math.floor(Math.random() * 99999999999) + 1;
  return `${nomeOriginal}-${sufixo}`;
}

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

    const serverAlvo = await client.guilds.fetch(idServerAlvo).catch(() => null);
    const serverDestino = await client.guilds.fetch(idServerDestino).catch(() => null);

    if (!serverAlvo || !serverDestino) {
      console.log('❌ Não consegui acessar um dos servidores.');
      process.exit();
    }

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

    await categoriaDestinoOriginal.setName(novoNomeCategoriaDestino).catch(() => {
      console.log('⚠️ Não foi possível renomear a categoria destino.');
    });

    const canaisAlvo = serverAlvo.channels.cache
      .filter(c => c.parentId === idCategoriaAlvo)
      .sort((a, b) => a.position - b.position);

    console.log(`Clonando ${canaisAlvo.size} canais...`);

    for (const [id, canal] of canaisAlvo) {
      try {
        const nomeSeguro = gerarNomeUnico(canal.name);
        const newChan = await serverDestino.channels.create(nomeSeguro, {
          type: canal.type,
          parent: idCategoriaDestino,
          topic: canal.topic || null,
          nsfw: canal.nsfw,
          rateLimitPerUser: canal.rateLimitPerUser || 0,
          position: canal.position
        });

        console.log(`✓ Canal clonado: ${canal.name} -> ${nomeSeguro}`);

        // Apenas canais de texto (TEXT ou MEDIA) podem ter mensagens clonadas
        if (canal.type === 'GUILD_TEXT' || canal.type === 'GUILD_MEDIA') {
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
            } catch {}

            await new Promise(r => setTimeout(r, 1200));
          }
        }

        await new Promise(r => setTimeout(r, 1500));

      } catch (e) {
        console.log(`Erro clonando canal ${canal.name}: ${e.message}`);
      }
    }

    console.log('\n✅ Clonagem finalizada.');
    process.exit();
  });
})();
