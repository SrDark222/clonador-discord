const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const gradient = require('gradient-string');
const figlet = require('figlet');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const titulo = `
 @@@@@@@  @@@        @@@@@@   @@@  @@@  @@@@@@@@  @@@@@@@      @@@  @@@    @@@
@@@@@@@@  @@@       @@@@@@@@  @@@@ @@@  @@@@@@@@  @@@@@@@@     @@@  @@@   @@@@
!@@       @@!       @@!  @@@  @@!@!@@@  @@!       @@!  @@@     @@!  @@@  @@@!!
!@!       !@!       !@!  @!@  !@!!@!@!  !@!       !@!  !@!     !@!  @!@    !@!
!@!       @!!       @!@  !@!  @!@ !!@!  @!!!:!    @!@!!@!      @!@  !@!    @!@
!!!       !!!       !@!  !!!  !@!  !!!  !!!!!:    !!@!@!       !@!  !!!    !@!
:!!       !!:       !!:  !!!  !!:  !!!  !!:       !!: :!!      :!:  !!:    !!:
:!:        :!:      :!:  !:!  :!:  !:!  :!:       :!:  !:!      ::!!:!     :!:
 ::: :::   :: ::::  ::::: ::   ::   ::   :: ::::  ::   :::       ::::      :::
 :: :: :  : :: : :   : :  :   ::    :   : :: ::    :   : :        :         ::
`;

const mostrarTitulo = () => {
  console.clear();
  console.log(gradient.pastel.multiline(titulo));
};

// Tradução usando MyMemory API, mas com fonte fixa EN para evitar erro AUTO
async function traduzirParaPortugues(texto) {
  if (!texto || texto.trim() === '') return '';

  try {
    // Usar EN|PT para evitar 'auto' inválido na API
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|pt`;
    console.log(chalk.blue('[API] Traduzindo mensagem via MyMemory...'));
    const res = await axios.get(url, { timeout: 60000 });
    if (res.data && res.data.responseData && res.data.responseData.translatedText) {
      console.log(chalk.green('[API] Tradução recebida.'));
      return res.data.responseData.translatedText;
    } else {
      console.log(chalk.red('[API] Resposta inválida da tradução.'));
      return texto;
    }
  } catch (err) {
    console.log(chalk.red(`[API] Erro na tradução: ${err.message}`));
    return texto;
  }
}

// Upload arquivo grande pro catbox
async function uploadBigFileToCatbox(filePath) {
  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath));

    const res = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000,
    });

    if (res.status === 200 && res.data.startsWith('https://')) {
      return res.data.trim();
    } else {
      throw new Error('Falha no upload do arquivo');
    }
  } catch (err) {
    throw new Error(`Erro uploadBigFileToCatbox: ${err.message}`);
  }
}

// Baixa o arquivo e sobe pro catbox
async function downloadAndUploadFile(attachment) {
  const tmpPath = `./temp_${attachment.id}_${attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  try {
    const writer = fs.createWriteStream(tmpPath);
    const response = await axios({
      url: attachment.url,
      method: 'GET',
      responseType: 'stream',
      timeout: 60000,
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const link = await uploadBigFileToCatbox(tmpPath);

    fs.unlinkSync(tmpPath);

    return link;
  } catch (error) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw new Error(`Falha download/upload: ${error.message}`);
  }
}

(async () => {
  mostrarTitulo();

  const token = await ask('\n[?] COLE SEU TOKEN: ');
  const idServerOrigem = await ask('[?] ID DO SERVIDOR DE ORIGEM: ');
  const idCategoriaOrigem = await ask('[?] ID DA CATEGORIA DE ORIGEM: ');
  const idServerDestino = await ask('[?] ID DO SERVIDOR DESTINO: ');
  const idCategoriaDestino = await ask('[?] ID DA CATEGORIA DESTINO: ');
  const novoNomeCategoriaDestino = await ask('[?] NOVO NOME DA CATEGORIA DESTINO: ');

  const client = new Discord.Client();

  client.login(token).catch(() => {
    console.log(gradient.cristal('\n❌ TOKEN INVÁLIDO. ENCERRANDO.'));
    process.exit();
  });

  client.on('ready', async () => {
    mostrarTitulo();
    console.log(gradient.instagram(`\n[+] SELF BOT LOGADO COMO ${client.user.tag}`));

    const origem = await client.guilds.fetch(idServerOrigem).catch(() => null);
    const destino = await client.guilds.fetch(idServerDestino).catch(() => null);

    if (!origem || !destino) {
      console.log(chalk.red('\n❌ Servidores inválidos.'));
      process.exit();
    }

    const catOrigem = origem.channels.cache.get(idCategoriaOrigem);
    const catDestino = destino.channels.cache.get(idCategoriaDestino);

    if (!catOrigem || !catDestino) {
      console.log(chalk.red('\n❌ Categorias inválidas.'));
      process.exit();
    }

    try {
      await catDestino.setName(novoNomeCategoriaDestino);
    } catch {
      console.log(chalk.red('\n❌ Falha ao renomear categoria destino.'));
    }

    const canais = origem.channels.cache
      .filter(c => c.parentId === idCategoriaOrigem)
      .sort((a, b) => a.position - b.position);

    for (const [_, canal] of canais) {
      try {
        const novoCanal = await destino.channels.create(canal.name, {
          type: canal.type,
          parent: catDestino.id,
        });
        console.log(gradient.vice(`[>] Clonando canal: ${canal.name}`));

        const msgs = await canal.messages.fetch({ limit: 50 });

        // Mensagens em ordem cronológica (mais antigas primeiro)
        for (const msg of [...msgs.values()].reverse()) {
          let content = msg.content || '';

          if (msg.attachments.size > 0) {
            for (const a of msg.attachments.values()) {
              if (a.size <= 9990000) {
                content += `\n[${a.name}](${a.url})`;
              } else {
                try {
                  const linkUpload = await downloadAndUploadFile(a);
                  content += `\n[${a.name}](${linkUpload})`;
                } catch (err) {
                  content += `\nERRO AO UPLOAD ARQUIVO GRANDE: ${err.message}`;
                }
              }
            }
          }

          // Traduzir texto, mas se o texto for vazio, não traduzir
          let conteudoTraduzido = content.trim() ? await traduzirParaPortugues(content) : '[mensagem vazia]';

          try {
            await novoCanal.send(conteudoTraduzido);
            console.log(gradient.morning(`[+1] ${canal.name}: Mensagem clonada e traduzida`));
          } catch (err) {
            console.log(gradient.passion(`[-] Erro ao enviar mensagem: ${err.message}`));
          }

          await sleep(1500); // evitar rate limit
        }

      } catch (err) {
        console.log(gradient.summer(`[-] Falha ao clonar canal ${canal.name}: ${err.message}`));
      }
    }

    console.log(gradient.fruit('\n✅ CLONAGEM E TRADUÇÃO CONCLUÍDAS!'));
    process.exit();
  });
})();
