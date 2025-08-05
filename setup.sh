#!/bin/bash

echo "🚀 Configurando Web Security Camera System..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker e Docker Compose encontrados"

# Criar arquivo .env se não existir
if [ ! -f "server/.env" ]; then
    echo "📝 Criando arquivo .env..."
    cp server/env.example server/.env
    echo "✅ Arquivo .env criado. Por favor, edite as configurações da câmera."
else
    echo "✅ Arquivo .env já existe"
fi

# Criar diretório records se não existir
if [ ! -d "server/records" ]; then
    echo "📁 Criando diretório records..."
    mkdir -p server/records
    echo "✅ Diretório records criado"
else
    echo "✅ Diretório records já existe"
fi

# Instalar dependências do servidor
echo "📦 Instalando dependências do servidor..."
cd server && npm install
cd ..

# Instalar dependências do cliente
echo "📦 Instalando dependências do cliente..."
cd client && npm install
cd ..

echo ""
echo "🎉 Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo server/.env com as configurações da sua câmera"
echo "2. Execute: docker-compose up -d"
echo "3. Acesse: http://localhost:5173"
echo ""
echo "🔧 Configurações padrão:"
echo "- MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
echo "- API Server: http://localhost:3000"
echo "- Health Check: http://localhost:3000/health"
echo "" 