#!/bin/bash

# Script de gerenciamento do Web Security Camera System

show_help() {
    echo "🚀 Web Security Camera System - Gerenciador"
    echo ""
    echo "Uso: ./manage.sh [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start       - Iniciar todos os serviços"
    echo "  stop        - Parar todos os serviços"
    echo "  restart     - Reiniciar todos os serviços"
    echo "  logs        - Mostrar logs de todos os serviços"
    echo "  logs-server - Mostrar logs apenas do servidor"
    echo "  logs-db     - Mostrar logs apenas do PostgreSQL"
    echo "  logs-minio  - Mostrar logs apenas do MinIO"
    echo "  status      - Mostrar status dos serviços"
    echo "  clean       - Limpar volumes e containers"
    echo "  backup      - Fazer backup do banco de dados"
    echo "  restore     - Restaurar backup do banco de dados"
    echo "  setup       - Configurar o projeto (primeira vez)"
    echo "  help        - Mostrar esta ajuda"
    echo ""
}

start_services() {
    echo "🚀 Iniciando serviços..."
    docker-compose up -d
    echo "✅ Serviços iniciados!"
    echo ""
    echo "📋 URLs de acesso:"
    echo "- Interface Web: http://localhost:5173"
    echo "- API Server: http://localhost:3000"
    echo "- MinIO Console: http://localhost:9001"
    echo "- Health Check: http://localhost:3000/health"
    echo ""
}

stop_services() {
    echo "🛑 Parando serviços..."
    docker-compose down
    echo "✅ Serviços parados!"
}

restart_services() {
    echo "🔄 Reiniciando serviços..."
    docker-compose down
    docker-compose up -d
    echo "✅ Serviços reiniciados!"
}

show_logs() {
    echo "📋 Mostrando logs de todos os serviços..."
    docker-compose logs -f
}

show_server_logs() {
    echo "📋 Mostrando logs do servidor..."
    docker-compose logs -f server
}

show_db_logs() {
    echo "📋 Mostrando logs do PostgreSQL..."
    docker-compose logs -f postgres
}

show_minio_logs() {
    echo "📋 Mostrando logs do MinIO..."
    docker-compose logs -f minio
}

show_status() {
    echo "📊 Status dos serviços:"
    echo ""
    docker-compose ps
    echo ""
    echo "💾 Uso de recursos:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

clean_all() {
    echo "🧹 Limpando volumes e containers..."
    read -p "Tem certeza? Isso irá remover todos os dados! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        docker system prune -f
        echo "✅ Limpeza concluída!"
    else
        echo "❌ Operação cancelada."
    fi
}

backup_database() {
    echo "💾 Fazendo backup do banco de dados..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U security_user security_cam_db > "backups/$BACKUP_FILE"
    echo "✅ Backup salvo em: backups/$BACKUP_FILE"
}

restore_database() {
    echo "📥 Restaurando backup do banco de dados..."
    if [ -z "$1" ]; then
        echo "❌ Especifique o arquivo de backup: ./manage.sh restore <arquivo>"
        exit 1
    fi
    
    if [ ! -f "backups/$1" ]; then
        echo "❌ Arquivo de backup não encontrado: backups/$1"
        exit 1
    fi
    
    read -p "Tem certeza? Isso irá sobrescrever o banco atual! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose exec -T postgres psql -U security_user -d security_cam_db < "backups/$1"
        echo "✅ Backup restaurado!"
    else
        echo "❌ Operação cancelada."
    fi
}

setup_project() {
    echo "🔧 Configurando projeto..."
    
    # Criar diretório de backups
    mkdir -p backups
    
    # Criar arquivo .env se não existir
    if [ ! -f "server/.env" ]; then
        cp server/env.example server/.env
        echo "✅ Arquivo .env criado. Edite as configurações da câmera."
    fi
    
    # Criar diretório records
    mkdir -p server/records
    
    # Instalar dependências
    echo "📦 Instalando dependências..."
    cd server && npm install && cd ..
    cd client && npm install && cd ..
    
    echo "✅ Configuração concluída!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Edite server/.env com as configurações da sua câmera"
    echo "2. Execute: ./manage.sh start"
}

# Verificar se o comando foi fornecido
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Processar comandos
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    logs-server)
        show_server_logs
        ;;
    logs-db)
        show_db_logs
        ;;
    logs-minio)
        show_minio_logs
        ;;
    status)
        show_status
        ;;
    clean)
        clean_all
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    setup)
        setup_project
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Comando desconhecido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 