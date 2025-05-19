const Discord = require('discord.js-selfbot-v13');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const gradient = require('gradient-string');
const figlet = require('figlet');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const banner = figlet.textSync('DKZIN Clonador', { horizontalLayout: 'default' });
console.clear();
console.log(gradient.pastel.multiline(banner));

// CONFIGURAÇÃO MANUAL AQUI DK
const token = 'SEU_TOKEN_DO_DISCORD';
const idServerOrigem = 'ID_SERVIDOR_ORIGEM';
const idCategoriaOrigem = 'ID_CATEGORIA_ORIGEM';
const idServerDestino = 'ID_SERVIDOR_DESTINO';
const idCategoriaDestino = 'ID_CATEGORIA_DESTINO';
const novoNomeCategoria = 'NOME_DA_CATEGORIA_CLONADA';

const client = new Discord.Client();

async function uploadToCatbox(filePath) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', fs.createReadStream(filePath));

  try {
    const res = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return res.data.startsWith('https') ? res.data : null;
  } catch (e) {
    return null;
  }
}

async function baixarArquivo(attachment) {
  const filePath = `./TEMP_${attachment.id}_${attachment.name.replace(/[^\w.-]/g, '')}`;
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url: attachment.url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath));
    writer.on('error', reject);
  });
}

client.on('ready', async () => {
  console.log(gradient.instagram(`\n[LOGADO COMO] ${client.user.tag}\n`));

  const origem = await client.guilds.fetch(idServerOrigem);
  const destino = await client.guilds.fetch(idServerDestino);

  const catOrigem = origem.channels.cache.get(idCategoriaOrigem);
  const catDestino = destino.channels.cache.get(idCategoriaDestino);

  if (!catOrigem || !catDestino) {
    console.log(gradient.cristal('❌ Categoria inválida.'));
    return process.exit();
  }

  try {
    await catDestino.setName(novoNomeCategoria);
  } catch {}

  const canaisOriginais = origem.channels.cache.filter(c => c.parentId === idCategoriaOrigem).sort((a, b) => a.rawPosition - b.rawPosition);
  const mapaCanais = new Map();

  for (const canal of canaisOriginais.values()) {
    try {
      const novoCanal = await destino.channels.create(canal.name, {
        type: canal.type,
        parent: catDestino.id,
        topic: canal.topic,
        rateLimitPerUser: canal.rateLimitPerUser,
        userLimit: canal.userLimit,
        bitrate: canal.bitrate
      });

      mapaCanais.set(canal.id, novoCanal.id);
      console.log(gradient.vice(`[+] Canal clonado: ${canal.name}`));

      if (canal.type === 0) {
        const mensagens = await canal.messages.fetch({ limit: 50 });

        for (const msg of [...mensagens.values()].reverse()) {
          let texto = msg.content || '';

          texto = texto.replace(/<#(\d+)>/g, (m, id) => {
            const novoId = mapaCanais.get(id);
            return novoId ? `<#${novoId}>` : m;
          });

          if (msg.attachments.size > 0) {
            for (const atch of msg.attachments.values()) {
              if (atch.size <= 9990000) {
                texto += `\n[${atch.name}](${atch.url})`;
              } else {
                try {
                  const caminho = await baixarArquivo(atch);
                  const link = await uploadToCatbox(caminho);
                  fs.unlinkSync(caminho);
                  if (link) {
                    texto += `\n[ARQUIVO GRANDE - CATBOX](${link})`;
                  } else {
                    texto += '\n[Erro ao subir para o Catbox]';
                  }
                } catch {
                  texto += '\n[Erro ao baixar/upload de arquivo]';
                }
              }
            }
          }

          try {
            await novoCanal.send(texto || '[mensagem vazia]');
            await sleep(1500);
          } catch (e) {
            console.log(gradient.summer(`[-] Falha msg: ${e.message}`));
          }
        }
      }
    } catch (e) {
      console.log(gradient.passion(`[-] Erro ao criar canal ${canal.name}: ${e.message}`));
    }
  }

  console.log(gradient.fruit('\n✅ Clonagem finalizada com sucesso!\n'));
  process.exit();
});

client.login(token);
