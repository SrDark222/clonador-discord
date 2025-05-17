const Discord = require('discord.js-selfbot-v13');
const axios = require('axios');
const readline = require('readline');
const gradient = require('gradient-string');

const client = new Discord.Client();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function gerarNome(base) { return `${base}${Math.floor(Math.random() * 999999)}${Date.now()}`; }

(async () => {
  console.clear();
  console.log(gradient.vice('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  CLONADOR DE CANAIS + MÍDIA V13  ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n'));

  const token = await ask('TOKEN DO SELF: ');
  const idOrigem = await ask('ID DO SERVIDOR DE ORIGEM: ');
  const idCategoriaOrigem = await ask('ID DA CATEGORIA DE ORIGEM: ');
  const idDestino = await ask('ID DO SERVIDOR DE DESTINO: ');
  const idCategoriaDestino = await ask('ID DA CATEGORIA DE DESTINO: ');
  const novoNomeCat = await ask('NOVO NOME PARA CATEGORIA: ');

  client.login(token).catch(() => {
    console.log('❌ Token inválido.');
    process.exit();
  });

  client.on('ready', async () => {
    console.log(`✅ Logado como ${client.user.tag}`);

    const serverOrigem = client.guilds.cache.get(idOrigem);
    const serverDestino = client.guilds.cache.get(idDestino);
    const catOrigem = serverOrigem.channels.cache.get(idCategoriaOrigem);
    const catDestino = serverDestino.channels.cache.get(idCategoriaDestino);

    if (!serverOrigem || !serverDestino || !catOrigem || !catDestino) return console.log('❌ IDs inválidos.');

    await catDestino.setName(novoNomeCat).catch(() => console.log('⚠️ Falha ao renomear categoria.'));

    const canais = serverOrigem.channels.cache
      .filter(c => c.parentId === idCategoriaOrigem && c.type === 0)
      .sort((a, b) => a.position - b.position);

    let count = 0;

    for (const canal of canais.values()) {
      try {
        const novoNome = gerarNome(canal.name);
        const canalNovo = await serverDestino.channels.create(novoNome, {
          type: 0,
          parent: idCategoriaDestino,
          topic: canal.topic || '',
        });
        console.log(`\n[+] Canal clonado: ${canal.name} => ${novoNome}`);

        let mensagens = [];
        let lastID = null;

        while (mensagens.length < 100) {
          const opt = { limit: 50 };
          if (lastID) opt.before = lastID;
          const lote = await canal.messages.fetch(opt);
          if (!lote.size) break;
          mensagens = mensagens.concat(Array.from(lote.values()));
          lastID = lote.last().id;
        }

        mensagens = mensagens.slice(0, 100).reverse();

        for (const msg of mensagens) {
          let conteudo = msg.content || '';
          let arquivos = [];

          for (const att of msg.attachments.values()) {
            if (att.size > 10485760) {
              conteudo += `\n(arquivo acima de 10mb ignorado: ${att.name})`;
              continue;
            }

            try {
              const ext = att.name.split('.').pop();
              const nomeArquivo = gerarNome('file') + '.' + ext;
              const buffer = (await axios.get(att.url, { responseType: 'arraybuffer' })).data;
              arquivos.push({ attachment: Buffer.from(buffer), name: nomeArquivo });
            } catch {
              conteudo += `\n(falha ao baixar: ${att.name})`;
            }
          }

          try {
            if (arquivos.length > 0) {
              await canalNovo.send({ content: conteudo, files: arquivos });
            } else if (conteudo.trim()) {
              await canalNovo.send(conteudo);
            }
            count++;
            console.log(`+1 log (${count})`);
          } catch {
            console.log(`-1 erro ao enviar`);
          }

          await delay(1500);
        }

        await delay(2000);
      } catch (e) {
        console.log(`Erro ao clonar canal ${canal.name}: ${e.message}`);
      }
    }

    console.log(`\n✅ Clonagem finalizada. Total: ${count} mensagens.`);
    process.exit();
  });
})();
