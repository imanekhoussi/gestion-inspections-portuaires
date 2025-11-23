# 🚢 Port Inspection Management System

> Complete GIS-based Web Application for Port Asset Inspection Management

[![Angular](https://img.shields.io/badge/Angular-20-red.svg)](https://angular.io/)
[![NestJS](https://img.shields.io/badge/NestJS-10-ea2845.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3+-green.svg)](https://postgis.net/)
[![OpenLayers](https://img.shields.io/badge/OpenLayers-9-1f6b75.svg)](https://openlayers.org/)

---

## 📌 Overview

A full-stack web application designed for **Tanger Med Engineering** to digitalize and streamline the inspection management of port infrastructures. The system provides:

- ✅ **NestJS Backend** – Secure RESTful API with JWT authentication
- ✅ **Angular Frontend** – Modern, responsive user interface
- ✅ **PostgreSQL/PostGIS** – Relational and geospatial data management
- ✅ **OpenLayers GIS** – Interactive map visualization
- ✅ **Inspection Workflow** – Planning, execution, validation cycle
- ✅ **FullCalendar Integration** – Visual inspection scheduling
- ✅ **Analytics Dashboards** – Real-time performance indicators

---

## 🏗️ Project Architecture

```
gestion-inspections/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/              # JWT authentication
│   │   ├── users/             # User management
│   │   ├── actifs/            # Asset management
│   │   ├── inspections/       # Inspection workflow
│   │   ├── livrables/         # File uploads
│   │   └── database/          # TypeORM configuration
│   ├── uploads/               # Uploaded files
│   ├── .env                   # Environment variables
│   └── package.json
│
├── frontend/                   # Angular Client
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # UI components
│   │   │   ├── services/     # API services
│   │   │   ├── guards/       # Auth guards
│   │   │   └── models/       # TypeScript interfaces
│   │   ├── assets/           # Static resources
│   │   └── environments/     # Environment config
│   └── package.json
│
├── README.md
├── INSTALL.md
└── install.sh
```

---

## 🛠️ Technology Stack

### Backend
- **Framework**: NestJS 10
- **ORM**: TypeORM
- **Database**: PostgreSQL 15+ with PostGIS 3+
- **Authentication**: JWT with Passport
- **Validation**: class-validator, class-transformer
- **File Upload**: Multer
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Angular 20
- **Mapping**: OpenLayers 9 + ol-ext
- **Calendar**: FullCalendar 6
- **Charts**: ngx-charts with D3
- **HTTP**: Angular HttpClient with RxJS

### Database
- **PostgreSQL** – Relational data
- **PostGIS** – Geospatial extension for GIS features

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 15+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/gestion-inspections.git
cd gestion-inspections

# Run automated installation
chmod +x install.sh
./install.sh

# Start application
./start-dev.sh
```

### Access Points
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api

### Default Login
```
Email:    admin@tangermed.ma
Password: admin123
```
⚠️ **Change password immediately after first login**

---

## 👥 User Roles & Features

### 🔑 Administrator
- Manage users and roles
- Create and organize assets (Family → Group → Asset)
- Schedule inspections
- Configure inspection types
- Access global dashboards

### 👷 Operator
- View assigned inspections
- Start/close inspections
- Upload reports and photos
- Update asset status
- View assets on map

### 👔 Manager
- Validate or reject inspections
- View complete inspection history
- Analyze performance metrics
- Export reports
- Monitor compliance

---

## 📸 Application Screenshots

### 1. Login Interface
![Login Screen](docs/images/login.png)
*Secure authentication with JWT tokens*

---

### 2. Administrator Dashboard
![Admin Dashboard](docs/images/admin-dashboard.png)
*Overview of users, assets, and inspections with quick access to management modules*

---

### 3. Asset Management
![Asset Management](docs/images/asset-management.png)
*Hierarchical organization: Family → Group → Asset with create/edit/delete operations*

---

### 4. Interactive GIS Map
![GIS Map](docs/images/gis-map-osm.png)
*OpenLayers-based map with OpenStreetMap view showing asset locations*

![Satellite View](docs/images/gis-map-satellite.png)
*Satellite imagery mode for detailed asset visualization*

![Map Filtering](docs/images/map-filtering.png)
*Dynamic filtering by asset status (Good/Average/Poor) with color-coded markers*

---

### 5. Inspection Planning
![Inspection Management](docs/images/inspection-list.png)
*Comprehensive inspection management with status tracking*

![Calendar View](docs/images/calendar-view.png)
*FullCalendar integration for visual inspection scheduling*

---

### 6. Operator Interface
![Operator Dashboard](docs/images/operator-dashboard.png)
*Operator-specific dashboard showing assigned inspections and performance metrics*

![Inspection Form](docs/images/inspection-form.png)
*Complete inspection form with asset details, comments, and file upload*

---

### 7. Manager Validation
![Manager Dashboard](docs/images/manager-dashboard.png)
*Manager dashboard with pending validations and analytics*

![Inspection Validation](docs/images/validation-interface.png)
*Validate or reject inspections with mandatory comments*

---

### 8. Inspection History & Traceability
![Inspection Logs](docs/images/inspection-logs.png)
*Complete audit trail of all inspection transitions with timestamps and user actions*

---

## 🗺️ GIS Features

### Interactive Mapping (OpenLayers)
- 🗺️ OpenStreetMap base layer
- 🛰️ Satellite imagery support
- 📍 Precise geolocation (EPSG:26191 → WGS84)
- 🎨 Dynamic symbology based on asset status
- 🔍 Zoom, pan, smooth navigation
- 🔎 Spatial filtering by zone/site
- 💬 Contextual popups with asset details

### Supported Geometry Types
- **Point**: Cameras, equipment, sensors
- **LineString**: Roads, quays, pipelines
- **Polygon**: Warehouses, zones, buildings

---

## 📅 Inspection Workflow

```
┌─────────────┐
│  Planned    │ ──► Administrator creates inspection
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  In Progress│ ──► Operator starts and performs inspection
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Closed    │ ──► Operator uploads report and closes
└──────┬──────┘
       │
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌──────────┐
│  Validated  │  │ Rejected │ ──► Manager validates or rejects
└─────────────┘  └────┬─────┘
                      │
                      └─► Return to Planned (with corrections)
```

**States:**
1. **Planned** – Scheduled by administrator
2. **In Progress** – Operator executing on-site
3. **Closed** – Report uploaded, awaiting validation
4. **Validated** – Approved by manager
5. **Rejected** – Requires corrections

---

## 🔒 Security Features

- 🔐 **JWT Authentication** – Token-based secure access
- 🛡️ **Role-Based Access Control** – Granular permissions
- 🔑 **bcrypt Password Hashing** – Industry-standard encryption
- 🚫 **Input Validation** – class-validator on all endpoints
- 📝 **Complete Audit Trail** – All actions logged

---

## 📦 Installation Guide

### Environment Configuration

**Backend `.env` file:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=gestion_inspections

# Security
JWT_SECRET=your_long_secure_random_secret_key

# Application
NODE_ENV=development
PORT=3000
```

**Frontend `environment.development.ts`:**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### Manual Installation

**Backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
ng serve
```

**Database:**
```sql
CREATE DATABASE gestion_inspections;
\c gestion_inspections
CREATE EXTENSION postgis;
```

For detailed instructions, see [INSTALL.md](INSTALL.md)

---

## 🧪 Testing

```bash
# Backend unit tests
cd backend
npm run test

# Backend e2e tests
npm run test:e2e

# Frontend tests
cd frontend
ng test
```

---

## 📦 Production Build

**Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

**Frontend:**
```bash
cd frontend
ng build --configuration production
# Output in dist/frontend/
```

---

## 📚 API Documentation

Complete API documentation available via Swagger UI:
- **URL**: http://localhost:3000/api
- **Format**: OpenAPI 3.0
- **Endpoints**: Auth, Users, Assets, Inspections, Files

---

## 🤝 Project Team

**Developed by:**
- **KHOUSSI Imane** 
- **ANDALOUSSI RKIOUAK Malak** 

**Supervised by:**
- M. Driss KHARBACH – Tanger Med Engineering

**Organization:** Tanger Med Engineering  
**Academic Year:** 2024/2025

---

## 🔮 Future Enhancements

- 📱 **Mobile App** – Offline-capable field inspection app
- 🤖 **Predictive Maintenance** – Machine learning for failure prediction
- 🌐 **ERP Integration** – Connect with existing management systems
- 🏗️ **Digital Twin** – 3D port model with real-time data
- 📊 **Advanced BI** – Enhanced analytics and reporting
- 🛰️ **Drone Integration** – Aerial imagery and automated inspections

---


## 🙏 Acknowledgments

Special thanks to:
- **Tanger Med Engineering** for project opportunity
- **FST Tangier** for academic support
- **Open-source community** for excellent frameworks and libraries

---

**Built with ❤️ for Tanger Med Port Complex**

*Faculty of Sciences and Technology, Tangier – Geoinformation Engineering Program*
