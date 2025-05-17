const Discord = require('discord.js-selfbot-v13');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');

const client = new Discord.Client();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));

(async () => {
  console.clear();
  console.log('──── 『 CLONAGEM DE CATEGORIA 』 ────');

  const token = await ask('SEU TOKEN: ');
  const idServerAlvo = await ask('ID DO SERVER ALVO: ');
  const idCategoriaAlvo = await ask('ID DA CATEGORIA A SER CLONADA: ');
  const idServerDestino = await ask('ID DO SERVER DESTINO: ');
  const idCategoriaDestino = await ask('ID DA CATEGORIA DE DESTINO: ');
  const novoNome = await ask('NOVO NOME PARA A CATEGORIA DE DESTINO: ');

  client.login(token).catch(() => {
    console.log('❌ Token inválido.');
    process.exit();
  });

  client.on('ready', async () => {
    console.log(`Logado como ${client.user.tag}`);

    const servidorOrigem = await client.guilds.fetch(idServerAlvo).catch(() => null);
    const servidorDestino = await client.guilds.fetch(idServerDestino).catch(() => null);
    if (!servidorOrigem || !servidorDestino) return console.log('❌ Erro ao acessar servidores.');

    const categoriaOrigem = servidorOrigem.channels.cache.get(idCategoriaAlvo);
    const categoriaDestino = servidorDestino.channels.cache.get(idCategoriaDestino);
    if (!categoriaOrigem || categoriaOrigem.type !== 'GUILD_CATEGORY') return console.log('❌ Categoria origem inválida.');
    if (!categoriaDestino || categoriaDestino.type !== 'GUILD_CATEGORY') return console.log('❌ Categoria destino inválida.');

    await categoriaDestino.setName(novoNome);

    const canais = servidorOrigem.channels.cache
      .filter(c => c.parentId === idCategoriaAlvo)
      .sort((a, b) => a.position - b.position);

    for (const [_, canal] of canais) {
      try {
        const novoCanal = await servidorDestino.channels.create(canal.name, {
          type: canal.type,
          parent: idCategoriaDestino,
          nsfw: canal.nsfw,
          topic: canal.topic || null,
          rateLimitPerUser: canal.rateLimitPerUser || 0
        });

        console.log(`✓ Canal criado: ${canal.name}`);

        let mensagens = [], lastID = null;
        while (mensagens.length < 100) {
          const fetched = await canal.messages.fetch({ limit: 50, before: lastID }).catch(() => null);
          if (!fetched || !fetched.size) break;
          mensagens.push(...fetched.values());
          lastID = fetched.last().id;
        }

        mensagens = mensagens.slice(0, 100).reverse();

        for (const msg of mensagens) {
          const conteudo = msg.content || '';
          let arquivos = [];

          for (const att of msg.attachments.values()) {
            const sizeMB = att.size / (1024 * 1024);
            if (sizeMB > 10) {
              await novoCanal.send(`${conteudo}\n[arquivo acima de 10MB ignorado]`);
              continue;
            }

            try {
              const buffer = await axios.get(att.url, { responseType: 'arraybuffer' });
              const nomeArq = `img-${Math.floor(Math.random() * 999999)}.${att.name.split('.').pop()}`;
              arquivos.push({ attachment: Buffer.from(buffer.data), name: nomeArq });
            } catch {
              await novoCanal.send(`${conteudo}\n[Erro ao baixar anexo: ${att.url}]`);
            }
          }

          if (arquivos.length) {
            await novoCanal.send({ content: conteudo, files: arquivos });
          } else if (conteudo) {
            await novoCanal.send(conteudo);
          }

          console.log(`+1 log: ${msg.author.username} > ${conteudo.substring(0, 40)}...`);
          await new Promise(r => setTimeout(r, 1200));
        }

      } catch (err) {
        console.log(`❌ Erro em ${canal.name}: ${err.message}`);
      }
    }

    console.log('\n✔ Clonagem finalizada!');
    process.exit();
  });
})();
