const Discord = require('discord.js-selfbot-v13');
const axios = require('axios');
const readline = require('readline');
const gradient = require('gradient-string');

const client = new Discord.Client();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function gerarNomeUnico(base) {
  const random = Math.floor(Math.random() * 99999999999);
  return `${base}-${random}`;
}

(async () => {
  console.clear();
  console.log(gradient.pastel('───「 CLONADOR DE CANAIS V13 / ARQUIVOS E MÍDIAS 」───\n'));

  const token = await ask('TOKEN: ');
  const idServerAlvo = await ask('ID DO SERVIDOR ALVO: ');
  const idCategoriaAlvo = await ask('ID DA CATEGORIA ALVO: ');
  const idServerDestino = await ask('ID DO SERVIDOR DESTINO: ');
  const idCategoriaDestino = await ask('ID DA CATEGORIA DESTINO: ');
  const novoNomeCategoria = await ask('NOVO NOME PARA A CATEGORIA: ');

  console.log(`\nALVO: ${idServerAlvo} | CATEGORIA: ${idCategoriaAlvo}`);
  console.log(`DESTINO: ${idServerDestino} | NOVO NOME: ${novoNomeCategoria}\n`);

  client.login(token).catch(() => {
    console.log('❌ TOKEN INVÁLIDO');
    process.exit();
  });

  client.on('ready', async () => {
    console.log(`✅ Logado como ${client.user.tag}\n`);

    const serverAlvo = client.guilds.cache.get(idServerAlvo);
    const serverDestino = client.guilds.cache.get(idServerDestino);
    const categoriaAlvo = serverAlvo.channels.cache.get(idCategoriaAlvo);
    const categoriaDestino = serverDestino.channels.cache.get(idCategoriaDestino);

    if (!serverAlvo || !serverDestino || !categoriaAlvo || !categoriaDestino) {
      console.log('❌ IDs inválidos.');
      process.exit();
    }

    await categoriaDestino.setName(novoNomeCategoria).catch(() => {
      console.log('⚠️ Falha ao renomear categoria destino.');
    });

    const canaisTexto = serverAlvo.channels.cache
      .filter(c => c.parentId === idCategoriaAlvo && c.type === 0)
      .sort((a, b) => a.position - b.position);

    let logCount = 0;

    for (const canal of canaisTexto.values()) {
      try {
        const nomeNovo = gerarNomeUnico(canal.name);
        const novoCanal = await serverDestino.channels.create(nomeNovo, {
          type: 0,
          parent: idCategoriaDestino,
          topic: canal.topic || null,
          nsfw: canal.nsfw,
        });

        console.log(`\n[+] Canal clonado: ${canal.name} => ${nomeNovo}`);

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
          let arquivos = [];
          let contentMsg = msg.content || '';

          if (msg.attachments.size > 0) {
            for (const file of msg.attachments.values()) {
              try {
                if (file.size > 10485760) {
                  contentMsg += `\n(arquivo acima de 10mb ignorado: ${file.name})`;
                  continue;
                }

                const res = await axios.get(file.url, { responseType: 'arraybuffer' });
                const ext = file.name.split('.').pop();
                const nomeArquivo = `img${Math.floor(Math.random() * 999999)}.${ext}`;
                arquivos.push({ attachment: Buffer.from(res.data), name: nomeArquivo });
              } catch {
                contentMsg += `\n(falha ao baixar ${file.name})`;
              }
            }
          }

          try {
            if (arquivos.length > 0) {
              await novoCanal.send({ content: contentMsg, files: arquivos });
            } else if (contentMsg.trim()) {
              await novoCanal.send(contentMsg);
            }
            logCount++;
            console.log(`+1 clonada (${logCount})`);
          } catch {
            console.log('-1 falhou');
          }

          await delay(1500);
        }

        await delay(2000);
      } catch (e) {
        console.log(`⚠️ Falha no canal ${canal.name}: ${e.message}`);
      }
    }

    console.log(`\n✓ FIM. Total de mensagens clonadas: ${logCount}`);
    process.exit();
  });
})();
