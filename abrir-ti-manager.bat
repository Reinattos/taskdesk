@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  echo Instalando dependencias do Gerenciador de tarefas...
  call npm install
)

if not exist dist (
  echo Gerando versao local do Gerenciador de tarefas...
  call npm run build
)

echo.
echo Gerenciador de tarefas sera aberto em http://127.0.0.1:5173/
echo Mantenha esta janela aberta enquanto estiver usando o site.
echo.
start "" "http://127.0.0.1:5173/"
call npm start
