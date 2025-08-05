# Web Security Camera System

Sistema de câmeras de segurança web com armazenamento em PostgreSQL e MinIO.

## 🚀 Funcionalidades

- **Streaming de Vídeo**: Transmissão em tempo real das câmeras IP
- **Gravação**: Captura e armazenamento de vídeos
- **Banco de Dados**: PostgreSQL para armazenar metadados e configurações
- **Armazenamento de Objetos**: MinIO para armazenar arquivos de vídeo
- **API REST**: Endpoints para gerenciar câmeras, gravações e eventos
- **Interface Web**: Dashboard React para visualização e controle

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Node.js Server │    │   PostgreSQL    │
│   (Port 5173)   │◄──►│   (Port 3000)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     MinIO       │
                       │   (Port 9000)   │
                       └─────────────────┘
```

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- Câmera IP compatível com ONVIF

## 🚀 Instalação e Uso

### 1. Clone o repositório
```bash
git clone <repository-url>
cd web-security-cam
```

### 2. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp server/env.example server/.env

# Edite as configurações da câmera
nano server/.env
```

### 3. Execute com Docker Compose
```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### 4. Acesse as aplicações

- **Interface Web**: http://localhost:5173
- **API Server**: http://localhost:3000
- **MinIO Console**: http://localhost:9001
- **Health Check**: http://localhost:3000/health

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Configuração da Câmera
IP=192.168.1.100          # IP da câmera
USER=admin                 # Usuário da câmera
PASS=admin123             # Senha da câmera

# Banco de Dados
DATABASE_URL=postgresql://security_user:security_password@postgres:5432/security_cam_db

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false

# Aplicação
NODE_ENV=production
PORT=3000
```

### Credenciais Padrão

- **PostgreSQL**: 
  - Usuário: `security_user`
  - Senha: `security_password`
  - Banco: `security_cam_db`

- **MinIO**: 
  - Usuário: `minioadmin`
  - Senha: `minioadmin123`

## 📊 API Endpoints

### Câmeras
- `GET /api/cameras` - Listar todas as câmeras
- `POST /api/cameras` - Adicionar nova câmera
- `GET /api/cameras/:id` - Obter câmera específica
- `PUT /api/cameras/:id` - Atualizar câmera
- `DELETE /api/cameras/:id` - Remover câmera
- `GET /api/cameras/:id/stats` - Estatísticas da câmera

### Gravações
- `GET /api/recordings` - Listar todas as gravações
- `POST /api/recordings/upload` - Fazer upload de gravação
- `GET /api/recordings/:id` - Obter gravação específica
- `DELETE /api/recordings/:id` - Remover gravação
- `GET /api/recordings/camera/:ip` - Gravações por câmera

### Eventos
- `GET /api/events` - Listar todos os eventos
- `POST /api/events` - Criar novo evento
- `GET /api/events/recent/24h` - Eventos das últimas 24h
- `GET /api/events/stats/overview` - Estatísticas dos eventos

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **cameras**: Informações das câmeras
- **recordings**: Metadados das gravações
- **events**: Eventos do sistema

## 📁 Estrutura do Projeto

```
web-security-cam/
├── client/                 # Frontend React
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── configs/       # Configurações (DB, MinIO)
│   │   ├── routes/        # Rotas da API
│   │   ├── stream/        # Streaming de vídeo
│   │   └── utils/         # Utilitários
│   └── records/           # Gravações locais
├── docker-compose.yml     # Orquestração Docker
└── README.md
```

## 🔍 Monitoramento

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs dos Serviços
```bash
# Logs do servidor
docker-compose logs server

# Logs do PostgreSQL
docker-compose logs postgres

# Logs do MinIO
docker-compose logs minio
```

## 🛠️ Desenvolvimento

### Executar localmente (sem Docker)

1. **Instalar dependências**
```bash
cd server && npm install
cd ../client && npm install
```

2. **Configurar banco de dados**
```bash
# Instalar PostgreSQL localmente ou usar Docker
docker run -d --name postgres-dev \
  -e POSTGRES_DB=security_cam_db \
  -e POSTGRES_USER=security_user \
  -e POSTGRES_PASSWORD=security_password \
  -p 5432:5432 postgres:15-alpine
```

3. **Configurar MinIO**
```bash
# Instalar MinIO localmente ou usar Docker
docker run -d --name minio-dev \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -p 9000:9000 -p 9001:9001 \
  minio/minio server /data --console-address ":9001"
```

4. **Executar aplicações**
```bash
# Terminal 1 - Servidor
cd server && npm run dev

# Terminal 2 - Cliente
cd client && npm run dev
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Câmera não conecta**
   - Verifique IP, usuário e senha
   - Teste conectividade de rede
   - Verifique se a câmera suporta ONVIF

2. **Banco de dados não conecta**
   - Verifique se o PostgreSQL está rodando
   - Confirme as credenciais no .env
   - Verifique a string de conexão

3. **MinIO não acessível**
   - Verifique se o MinIO está rodando
   - Confirme as credenciais
   - Verifique as políticas dos buckets

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request
 
