const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const gradient = require('gradient-string');
const figlet = require('figlet');
const chalk = require('chalk');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const util = require('util');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const typeEffect = async (text) => {
  for (const char of text) {
    process.stdout.write(char);
    await sleep(20);
  }
  process.stdout.write('\n');
};

const titulo = `
 @@@@@@@  @@@        @@@@@@   @@@  @@@  @@@@@@@@  @@@@@@@      @@@  @@@    @@@
@@@@@@@@  @@@       @@@@@@@@  @@@@ @@@  @@@@@@@@  @@@@@@@@     @@@  @@@   @@@@
!@@       @@!       @@!  @@@  @@!@!@@@  @@!       @@!  @@@     @@!  @@@  @@@!!
!@!       !@!       !@!  @!@  !@!!@!@!  !@!       !@!  @!@     !@!  @!@    !@!
!@!       @!!       @!@  !@!  @!@ !!@!  @!!!:!    @!@!!@!      @!@  !@!    @!@
!!!       !!!       !@!  !!!  !@!  !!!  !!!!!:    !!@!@!       !@!  !!!    !@!
:!!       !!:       !!:  !!!  !!:  !!!  !!:       !!: :!!      :!:  !!:    !!:
:!:        :!:      :!:  !:!  :!:  !:!  :!:       :!:  !:!      ::!!:!     :!:
 ::: :::   :: ::::  ::::: ::   ::   ::   :: ::::  ::   :::       ::::      :::
 :: :: :  : :: : :   : :  :   ::    :   : :: ::    :   : :        :         ::
`;

const mostrarTitulo = async () => {
  console.clear();
  console.log(gradient.pastel.multiline(titulo));
};

async function uploadBigFileToGoFile(url, fileName) {
  try {
    const getServer = await axios.get('https://api.gofile.io/getServer');
    const server = getServer.data.data.server;
    const form = new FormData();
    form.append('file', fs.createReadStream(fileName));

    const response = await axios.post(`https://${server}.gofile.io/uploadFile`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    if (response.data.status === 'ok') {
      return response.data.data.downloadPage;
    } else {
      throw new Error(`Erro no upload GoFile: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    throw new Error(`Falha upload GoFile: ${error.message}`);
  }
}

(async () => {
  await mostrarTitulo();

  await typeEffect('\n[?] COLE SEU TOKEN: ');
  const token = await ask('');

  await typeEffect('[?] ID DO SERVIDOR DE ORIGEM: ');
  const idServerOrigem = await ask('');

  await typeEffect('[?] ID DA CATEGORIA DE ORIGEM: ');
  const idCategoriaOrigem = await ask('');

  await typeEffect('[?] ID DO SERVIDOR DESTINO: ');
  const idServerDestino = await ask('');

  await typeEffect('[?] ID DA CATEGORIA DESTINO: ');
  const idCategoriaDestino = await ask('');

  await typeEffect('[?] NOVO NOME DA CATEGORIA DESTINO: ');
  const novoNomeCategoriaDestino = await ask('');

  // Delay após o input para evitar bug ASCII
  console.clear();
  await sleep(1500);

  const client = new Discord.Client();

  client.login(token).catch(() => {
    console.log(gradient.cristal('\n❌ TOKEN INVÁLIDO. ENCERRANDO.'));
    process.exit();
  });

  client.on('ready', async () => {
    await mostrarTitulo();
    console.log(gradient.instagram(`\n[+] SELF BOT LOGADO COMO ${client.user.tag}`));

    const origem = await client.guilds.fetch(idServerOrigem).catch(() => null);
    const destino = await client.guilds.fetch(idServerDestino).catch(() => null);

    if (!origem || !destino) {
      console.log('\n❌ Servidores inválidos.');
      process.exit();
    }

    const catOrigem = origem.channels.cache.get(idCategoriaOrigem);
    const catDestino = destino.channels.cache.get(idCategoriaDestino);

    if (!catOrigem || !catDestino) {
      console.log('\n❌ Categorias inválidas.');
      process.exit();
    }

    await catDestino.setName(novoNomeCategoriaDestino);

    const canais = origem.channels.cache
      .filter(c => c.parentId === idCategoriaOrigem)
      .sort((a, b) => a.position - b.position);

    for (const [_, canal] of canais) {
      try {
        const novoCanal = await destino.channels.create(canal.name, {
          type: canal.type,
          parent: catDestino.id,
          topic: canal.topic || ''
        });

        const msgs = await canal.messages.fetch({ limit: 50 });

        for (const msg of msgs.reverse().values()) {
          let content = msg.content || '';

          if (msg.attachments.size > 0) {
            for (const a of msg.attachments.values()) {
              if (a.size <= 9990000) {
                content += `\n[Arquivo: ${a.name}] ${a.url}`;
              } else {
                // Arquivo maior que 10MB: faz upload no GoFile
                try {
                  const tmpPath = `./temp_${a.id}_${a.name}`;
                  const writer = fs.createWriteStream(tmpPath);
                  const response = await axios({
                    url: a.url,
                    method: 'GET',
                    responseType: 'stream',
                  });

                  response.data.pipe(writer);

                  await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                  });

                  const linkUpload = await uploadBigFileToGoFile(a.url, tmpPath);

                  content += `\n[Arquivo grande: ${a.name}] ${linkUpload}`;

                  // Apaga arquivo temporário
                  fs.unlinkSync(tmpPath);
                } catch (err) {
                  content += `\n[ERRO AO UPLOAD ARQUIVO GRANDE: ${a.name}]`;
                }
              }
            }
          }

          try {
            await novoCanal.send(content || '[mensagem vazia]');
            console.log(gradient.morning(`[+1] ${canal.name}: Mensagem clonada`));
          } catch (err) {
            console.log(gradient.passion(`[-] Erro ao enviar: ${err.message}`));
          }

          await sleep(1300);
        }

      } catch (err) {
        console.log(gradient.summer(`[-] Falha ao clonar canal ${canal.name}: ${err.message}`));
      }
    }

    console.log(gradient.fruit('\n✅ CLONAGEM CONCLUÍDA!'));
    process.exit();
  });
})();
