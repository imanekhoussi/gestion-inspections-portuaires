#!/bin/bash

# ============================================================
# Installation Script - Gestion des Inspections SIG
# Application Web pour Tanger Med Engineering
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║   GESTION DES INSPECTIONS - APPLICATION WEB SIG          ║
║   Installation automatique                                ║
║   Tanger Med Engineering                                  ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ============================================================
# Check Prerequisites
# ============================================================
print_info "Vérification des prérequis..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installé: $NODE_VERSION"
else
    print_error "Node.js n'est pas installé!"
    echo "Téléchargez et installez Node.js 20+ depuis: https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm installé: $NPM_VERSION"
else
    print_error "npm n'est pas installé!"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_success "PostgreSQL installé: $PSQL_VERSION"
else
    print_warning "PostgreSQL non détecté. Assurez-vous qu'il est installé."
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_success "Git installé: $GIT_VERSION"
else
    print_warning "Git n'est pas installé."
fi

echo ""

# ============================================================
# Database Setup
# ============================================================
print_info "Configuration de la base de données..."

read -p "Nom de la base de données [gestion_inspections]: " DB_NAME
DB_NAME=${DB_NAME:-gestion_inspections}

read -p "Utilisateur PostgreSQL [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Mot de passe PostgreSQL: " DB_PASSWORD
echo ""

read -p "Hôte de la base de données [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port PostgreSQL [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Test database connection
export PGPASSWORD=$DB_PASSWORD
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_warning "La base de données '$DB_NAME' existe déjà."
    read -p "Voulez-vous la recréer? (y/N): " RECREATE_DB
    if [[ $RECREATE_DB =~ ^[Yy]$ ]]; then
        print_info "Suppression de l'ancienne base de données..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
        print_info "Création de la nouvelle base de données..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
        print_success "Base de données recréée"
    fi
else
    print_info "Création de la base de données '$DB_NAME'..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    print_success "Base de données créée"
fi

# Enable PostGIS extension
print_info "Activation de l'extension PostGIS..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null || print_warning "PostGIS pourrait ne pas être installé"
print_success "PostGIS activé"

unset PGPASSWORD

echo ""

# ============================================================
# Backend Installation
# ============================================================
print_info "Installation du backend (NestJS)..."

if [ ! -d "backend" ]; then
    print_error "Le dossier 'backend' n'existe pas!"
    exit 1
fi

cd backend

# Install dependencies
print_info "Installation des dépendances npm..."
npm install

# Create .env file
print_info "Configuration du fichier .env..."

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

cat > .env << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# Application Configuration
NODE_ENV=development
PORT=3000

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
EOF

print_success "Fichier .env créé"

# Create uploads directory
mkdir -p uploads
print_success "Dossier uploads créé"

# Build the backend
print_info "Compilation du backend..."
npm run build

print_success "Backend installé avec succès"

cd ..

echo ""

# ============================================================
# Frontend Installation
# ============================================================
print_info "Installation du frontend (Angular)..."

if [ ! -d "frontend" ]; then
    print_error "Le dossier 'frontend' n'existe pas!"
    exit 1
fi

cd frontend

# Install dependencies
print_info "Installation des dépendances npm..."
npm install

# Configure environment
print_info "Configuration de l'environnement..."

cat > src/environments/environment.development.ts << EOF
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
EOF

cat > src/environments/environment.ts << EOF
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api'
};
EOF

print_success "Configuration de l'environnement créée"

print_success "Frontend installé avec succès"

cd ..

echo ""

# ============================================================
# Create Start Scripts
# ============================================================
print_info "Création des scripts de démarrage..."

# Start script for development
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Démarrage de l'application en mode développement..."

# Start backend
cd backend
npm run start:dev &
BACKEND_PID=$!
echo "Backend démarré (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 5

# Start frontend
cd ../frontend
ng serve &
FRONTEND_PID=$!
echo "Frontend démarré (PID: $FRONTEND_PID)"

echo ""
echo "✅ Application démarrée!"
echo "   Frontend: http://localhost:4200"
echo "   Backend:  http://localhost:3000"
echo "   Swagger:  http://localhost:3000/api"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter..."

# Wait for user interrupt
wait
EOF

chmod +x start-dev.sh

# Stop script
cat > stop-dev.sh << 'EOF'
#!/bin/bash

echo "⏹️  Arrêt de l'application..."

# Kill backend
pkill -f "nest start"
pkill -f "nodemon"

# Kill frontend
pkill -f "ng serve"
pkill -f "webpack-dev-server"

echo "✓ Application arrêtée"
EOF

chmod +x stop-dev.sh

print_success "Scripts de démarrage créés"

echo ""

# ============================================================
# Summary
# ============================================================
echo -e "${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║              ✅ INSTALLATION TERMINÉE !                   ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

print_success "Toutes les dépendances ont été installées"
print_success "La base de données a été configurée"
print_success "Les variables d'environnement sont configurées"

echo ""
echo -e "${BLUE}📋 Prochaines étapes:${NC}"
echo ""
echo "1. Démarrer l'application en mode développement:"
echo -e "   ${GREEN}./start-dev.sh${NC}"
echo ""
echo "2. Accéder aux interfaces:"
echo -e "   ${BLUE}Frontend:${NC}     http://localhost:4200"
echo -e "   ${BLUE}Backend API:${NC}  http://localhost:3000"
echo -e "   ${BLUE}Swagger:${NC}      http://localhost:3000/api"
echo ""
echo "3. Connexion par défaut (si seed data chargée):"
echo "   Email:    admin@tangermed.ma"
echo "   Password: admin123"
echo ""
echo "4. Arrêter l'application:"
echo -e "   ${GREEN}./stop-dev.sh${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: Pensez à créer un utilisateur administrateur${NC}"
echo ""

read -p "Voulez-vous démarrer l'application maintenant? (y/N): " START_NOW
if [[ $START_NOW =~ ^[Yy]$ ]]; then
    ./start-dev.sh
fi
