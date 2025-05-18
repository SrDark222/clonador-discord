const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const gradient = require('gradient-string');
const figlet = require('figlet');

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

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(gradient.pastel(q), res));

function mostrarTitulo() {
  console.clear();
  console.log(gradient.rainbow(titulo));
  console.log(gradient.vice('\n[HACKER-KALI-SELFBOT]\n'));
}

async function menu() {
  while (true) {
    mostrarTitulo();
    console.log(gradient.cristal('1) Clonar canais de categoria'));
    console.log(gradient.cristal('2) Sair\n'));
    const opc = await ask('\nEscolha uma opção: ');

    if (opc === '1') {
      await clonarCanais();
    } else if (opc === '2') {
      console.log(gradient.morning('\nSaindo... Até mais, chefe!'));
      process.exit();
    } else {
      console.log(gradient.passion('\nOpção inválida, tente novamente.'));
    }
  }
}

async function clonarCanais() {
  mostrarTitulo();

  const token = await ask('\n[?] Cole seu TOKEN: ');
  const idServerOrigem = await ask('[?] ID do servidor de ORIGEM: ');
  const idCategoriaOrigem = await ask('[?] ID da categoria de ORIGEM: ');
  const idServerDestino = await ask('[?] ID do servidor DESTINO: ');
  const idCategoriaDestino = await ask('[?] ID da categoria DESTINO: ');
  const novoNomeCategoriaDestino = await ask('[?] Novo nome da categoria destino: ');

  const client = new Discord.Client();

  try {
    await client.login(token);
  } catch {
    console.log(gradient.cristal('\n❌ Token inválido. Voltando ao menu.'));
    return;
  }

  client.on('ready', async () => {
    console.log(gradient.instagram(`\n[+] Selfbot logado como ${client.user.tag}`));

    const origem = await client.guilds.fetch(idServerOrigem).catch(() => null);
    const destino = await client.guilds.fetch(idServerDestino).catch(() => null);

    if (!origem || !destino) {
      console.log(gradient.passion('\n❌ Servidores inválidos. Voltando ao menu.'));
      await client.destroy();
      return;
    }

    const catOrigem = origem.channels.cache.get(idCategoriaOrigem);
    const catDestino = destino.channels.cache.get(idCategoriaDestino);

    if (!catOrigem || !catDestino) {
      console.log(gradient.passion('\n❌ Categorias inválidas. Voltando ao menu.'));
      await client.destroy();
      return;
    }

    try {
      await catDestino.setName(novoNomeCategoriaDestino);
    } catch {
      console.log(gradient.passion('\n❌ Falha ao renomear categoria destino.'));
    }

    const canais = origem.channels.cache
      .filter(c => c.parentId === idCategoriaOrigem)
      .sort((a, b) => a.position - b.position);

    for (const [_, canal] of canais) {
      try {
        const novoCanal = await destino.channels.create(canal.name, {
          type: canal.type,
          parent: catDestino.id
        });

        const msgs = await canal.messages.fetch({ limit: 50 });

        for (const msg of msgs.reverse().values()) {
          let content = msg.content || '';

          if (msg.attachments.size > 0) {
            for (const a of msg.attachments.values()) {
              if (a.size <= 9990000) {
                content += `\n[Arquivo: ${a.name}] ${a.url}`;
              } else {
                content += `\n[IGNORADO: ${a.name} acima de 10MB]`;
              }
            }
          }

          try {
            await novoCanal.send(content || '[mensagem vazia]');
            console.log(gradient.morning(`[+1] ${canal.name}: Mensagem clonada`));
          } catch (err) {
            console.log(gradient.passion(`[-] Erro ao enviar: ${err.message}`));
          }

          await new Promise(r => setTimeout(r, 1300));
        }
      } catch (err) {
        console.log(gradient.summer(`[-] Falha ao clonar canal ${canal.name}: ${err.message}`));
      }
    }

    console.log(gradient.fruit('\n✅ CLONAGEM CONCLUÍDA! Voltando ao menu.'));
    await client.destroy();
  });
}

(async () => {
  await menu();
})();
