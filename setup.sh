#!/data/data/com.termux/files/usr/bin/bash

# Limpeza visual do terminal
clear
echo -e "\033[1;31m[⚠️] LIMPEZA VISUAL INICIADA...\033[0m"
sleep 1
clear

# Atualização de pacotes
echo -e "\033[1;34m[+] Atualizando pacotes...\033[0m"
pkg update -y && pkg upgrade -y
clear

# Instalação de git e nodejs
echo -e "\033[1;34m[+] Instalando Git e NodeJS...\033[0m"
pkg install git nodejs -y
clear

# Remoção de projeto anterior (se tiver)
echo -e "\033[1;33m[+] Limpando clonador antigo...\033[0m"
rm -rf clonador-discord
clear

# Clonagem do projeto
echo -e "\033[1;32m[+] Clonando o projeto do GitHub...\033[0m"
git clone https://github.com/SrDark222/clonador-discord.git
cd clonador-discord
clear

# Instalação de dependências
echo -e "\033[1;36m[+] Instalando dependências NPM...\033[0m"
npm install
clear

# Painel limpo e execução final
echo -e "\033[1;35m[✓] Tudo pronto, iniciando o painel...\033[0m"
sleep 1
clear
npm start
