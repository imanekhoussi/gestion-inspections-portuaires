# ⚡ Quick Start Guide

> Démarrage rapide en 5 minutes

---

## 🎯 Installation Express

### 1️⃣ Cloner le Projet

```bash
git clone https://github.com/imanekhoussi/gestion-inspections-portuaires.git
cd gestion-inspections
```

### 2️⃣ Installation Automatique

```bash
chmod +x install.sh
./install.sh
```

Le script vous demandera:
- Nom de la base de données (défaut: `gestion_inspections`)
- Utilisateur PostgreSQL (défaut: `postgres`)
- Mot de passe PostgreSQL

### 3️⃣ Démarrer l'Application

```bash
./start-dev.sh
```

### 4️⃣ Accéder à l'Application

| Interface | URL | Description |
|-----------|-----|-------------|
| **Frontend** | http://localhost:4200 | Interface utilisateur |
| **Backend** | http://localhost:3000 | API REST |
| **Swagger** | http://localhost:3000/api | Documentation API |

---

## 🔑 Connexion par Défaut

Après avoir créé un utilisateur administrateur:

```
Email:    admin@tangermed.ma
Password: admin123
```

**⚠️ Important**: Changez ce mot de passe immédiatement après la première connexion!

---

## 🛑 Arrêter l'Application

```bash
./stop-dev.sh
```

Ou appuyez sur `Ctrl+C` dans les terminaux.

---

## 📂 Structure des Commandes

### Backend

```bash
cd backend

# Développement
npm run start:dev

# Production
npm run build
npm run start:prod

# Tests
npm run test
npm run test:e2e
```

### Frontend

```bash
cd frontend

# Développement
ng serve

# Production
ng build --configuration production

# Tests
ng test
ng e2e
```

---

## 🔧 Configuration Rapide

### Backend (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=gestion_inspections

JWT_SECRET=generer_une_cle_secrete_longue_ici
NODE_ENV=development
PORT=3000
```

### Frontend (environment.development.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

---

## ✅ Vérification Santé

```bash
# Backend health check
curl http://localhost:3000/health

# API login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tangermed.ma","password":"admin123"}'
```

---

## 🐛 Problèmes Courants

### Port déjà utilisé

```bash
# Tuer le processus sur le port 3000
lsof -ti:3000 | xargs kill -9

# Ou changer le port dans .env
PORT=3001
```

### PostgreSQL non connecté

```bash
# Vérifier le statut
sudo systemctl status postgresql

# Démarrer PostgreSQL
sudo systemctl start postgresql
```

### Erreur npm install

```bash
npm install --legacy-peer-deps
```

---

## 📚 Documentation Complète

- [README.md](README.md) - Vue d'ensemble du projet
- [INSTALL.md](INSTALL.md) - Guide d'installation détaillé
- [API Swagger](http://localhost:3000/api) - Documentation de l'API

---

## 🚀 Prochaines Étapes

1. ✅ Créer votre premier utilisateur administrateur
2. ✅ Configurer les familles d'actifs
3. ✅ Ajouter des actifs portuaires
4. ✅ Planifier votre première inspection
5. ✅ Explorer la carte SIG interactive

---

**Besoin d'aide? Consultez [INSTALL.md](INSTALL.md) pour plus de détails.**
