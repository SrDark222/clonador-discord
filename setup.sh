#!/data/data/com.termux/files/usr/bin/bash

# Limpeza visual total
clear
echo -e "\033[1;31m[⚠️] LIMPEZA INICIAL...\033[0m"
sleep 1
clear

# Atualização dos pacotes do Termux
echo -e "\033[1;34m[+] Atualizando pacotes...\033[0m"
pkg update -y && pkg upgrade -y
clear

# Instalação do Git e Node.js
echo -e "\033[1;34m[+] Instalando Git e NodeJS...\033[0m"
pkg install git nodejs -y
clear

# Remoção do projeto antigo se existir
echo -e "\033[1;33m[+] Limpando clonador antigo...\033[0m"
rm -rf clonador-discord
clear

# Clonando projeto do GitHub
echo -e "\033[1;32m[+] Clonando projeto do GitHub...\033[0m"
git clone https://github.com/SrDark222/clonador-discord.git
cd clonador-discord
clear

# Instalação de libs uma por uma com estilo
echo -e "\033[1;36m[1/6] Instalando \033[1;35mdiscord.js-selfbot-v13\033[0m"
npm install discord.js-selfbot-v13
clear

echo -e "\033[1;36m[2/6] Instalando \033[1;35mgradient-string\033[0m"
npm install gradient-string
clear

echo -e "\033[1;36m[3/6] Instalando \033[1;35mchalk\033[0m"
npm install chalk
clear

echo -e "\033[1;36m[4/6] Instalando \033[1;35mfiglet\033[0m"
npm install figlet
clear

echo -e "\033[1;36m[5/6] Instalando \033[1;35mreadline-sync\033[0m"
npm install readline-sync
clear

echo -e "\033[1;36m[6/6] Instalando \033[1;35maxios\033[0m"
npm install axios
clear

# Finalização com estilo
echo -e "\033[1;32m[✓] Todas dependências instaladas com sucesso!\033[0m"
echo -e "\033[1;34m[+] Iniciando o script...\033[0m"
sleep 1
clear

npm start
