const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const gradient = require('gradient-string');
const figlet = require('figlet');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(gradient.pastel(q), res));

console.clear();
console.log(gradient.retro(`
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
`));

(async () => {
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

    console.log(gradient.fruit('\n✅ CLONAGEM CONCLUÍDA!'));
    process.exit();
  });
})();
