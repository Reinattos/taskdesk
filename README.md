# Gerenciador de tarefas

Aplicativo React local para anotar e concluir tarefas do dia.

## Recursos

- Lista unica de tarefas do dia.
- Campo rapido para adicionar tarefas.
- Checkbox para marcar como concluida.
- Separacao entre pendentes e concluidas.
- Exclusao de tarefas.
- Persistencia inicial no navegador com `localStorage`.
- Interface responsiva para desktop e celular.

## Como executar

### Opcao mais simples

Abra o arquivo:

```text
abrir-ti-manager.bat
```

Ele instala o que faltar, gera a versao local, abre o navegador e mantem o Gerenciador de tarefas rodando.

### Pelo terminal

1. Instale as dependencias:

```bash
npm install
```

2. Gere a versao pronta do app:

```bash
npm run build
```

3. Inicie o servidor local:

```bash
npm start
```

4. Abra o endereco mostrado no terminal:

```text
http://127.0.0.1:5173
```

Os dados ficam salvos no navegador usado para acessar o app.

## Extensao para navegador

O projeto inclui uma extensao local em:

```text
extension
```

Como instalar no Chrome ou Edge:

1. Abra `chrome://extensions` ou `edge://extensions`.
2. Ative o modo de desenvolvedor.
3. Clique em "Carregar sem compactacao".
4. Selecione a pasta `extension` deste projeto.
5. Clique no icone do Gerenciador de tarefas para abrir o site local.

Importante: por seguranca, a extensao nao inicia o servidor local sozinha. Antes de clicar nela, deixe o Gerenciador de tarefas rodando com `abrir-ti-manager.bat` ou `npm start`.
