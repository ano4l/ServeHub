# Serveify - Enterprise Service Marketplace Platform

A comprehensive Spring Boot + Next.js service marketplace platform connecting customers with verified service providers.

## 🏗️ Architecture

### Backend (Java 21 + Spring Boot 3)
- **Spring Web** (REST APIs)
- **Spring Security** (JWT + RBAC)
- **Spring Data JPA** (Hibernate)
- **PostgreSQL** (Primary datastore)
- **Redis** (Caching, rate limiting, session management)
- **Flyway** (Database migrations)
- **Spring WebSocket** (Real-time chat)
- **SpringDoc OpenAPI** (API documentation)
- **Quartz** (Scheduled jobs)

### Frontend (Next.js 15 + TypeScript)
- **React 19** with Server Components
- **TailwindCSS** (Utility-first styling)
- **Zustand** (State management)
- **React Hook Form + Zod** (Forms & validation)
- **Framer Motion** (Animations)
- **STOMP.js** (WebSocket client)
- **Radix UI** (Accessible components)

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Node.js 21+
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd service-marketplace

# Start all services
docker-compose up -d

# Wait for services to be healthy (2-3 minutes)
docker-compose ps

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080/api/v1
# API Docs: http://localhost:8080/swagger-ui.html
```

### Manual Setup

#### Backend
```bash
# Navigate to backend directory
cd service-marketplace

# Start PostgreSQL and Redis
docker run -d --name postgres -e POSTGRES_DB=service_marketplace -e POSTGRES_USER=marketplace -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16-alpine
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run the application
./mvnw spring-boot:run
```

#### Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

## 📁 Project Structure

```
service-marketplace/
├── src/
│   └── main/
│       ├── java/com/marketplace/
│       │   ├── identity/          # Auth & user management
│       │   ├── customer/          # Customer features
│       │   ├── provider/          # Provider features
│       │   ├── catalog/           # Service catalog
│       │   ├── booking/           # Booking engine
│       │   ├── messaging/         # Real-time chat
│       │   ├── payment/           # Payment processing
│       │   ├── review/            # Ratings & reviews
│       │   ├── dispute/           # Dispute management
│       │   ├── notification/      # Notifications
│       │   └── admin/             # Admin console
│       └── resources/
│           ├── db/migration/      # Flyway migrations
│           └── application.yml    # Configuration
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js app router
│   │   ├── components/            # React components
│   │   ├── lib/                   # Utilities & API
│   │   └── store/                 # State management
│   ├── public/                    # Static assets
│   └── package.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_marketplace
DB_USERNAME=marketplace
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRATION=900000
JWT_REFRESH_TOKEN_EXPIRATION=604800000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

## 🎯 Features

### Customer Features
- **Discovery**: Search and filter providers by location, category, rating
- **Booking Flow**: Complete booking journey with status tracking
- **Real-time Chat**: In-app messaging with providers
- **Reviews**: Rate and review completed services
- **Payment**: Secure payment processing (optional)

### Provider Features
- **Dashboard**: Manage bookings, earnings, and availability
- **Service Management**: Set up services, pricing, and schedule
- **Verification**: Complete verification process to build trust
- **Wallet**: Track earnings and request payouts
- **Analytics**: View performance metrics and insights

### Admin Features
- **User Management**: Manage customers and providers
- **Verification Queue**: Review and approve provider applications
- **Dispute Resolution**: Handle customer disputes and refunds
- **Analytics Dashboard**: Platform metrics and KPIs
- **System Configuration**: Manage categories, fees, and settings

## 🔐 Security

- **JWT Authentication**: Access + refresh tokens with rotation
- **Role-Based Access Control**: Customer/Provider/Admin roles
- **Rate Limiting**: Redis-based rate limiting
- **Input Validation**: Comprehensive validation with Spring Validation
- **Audit Logging**: Complete audit trail for admin actions
- **Data Encryption**: PII encryption at rest
- **Secure Headers**: Security headers and CSRF protection

## 📊 Monitoring & Observability

- **Spring Boot Actuator**: Health checks and metrics
- **Prometheus**: Metrics collection
- **Structured Logging**: JSON logging with correlation IDs
- **Error Tracking**: Integration with error monitoring services
- **Performance Monitoring**: Request tracing and performance metrics

## 🚀 Deployment

### Production Deployment

#### Using Docker
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3 --scale frontend=2
```

#### Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n marketplace
```

### Environment Configuration

#### Development
- Hot reload enabled
- Debug logging
- Local database
- Mock services

#### Production
- Optimized builds
- Structured logging
- Managed database
- External services

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
./mvnw test

# Run integration tests
./mvnw test -P integration-test

# Generate test coverage report
./mvnw jacoco:report
```

### Frontend Tests
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Generate test coverage
npm run test:coverage
```

## 📚 API Documentation

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/api-docs
- **API Examples**: Check `/docs/api-examples.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Open an issue on GitHub
- **Discussions**: Join our GitHub Discussions

## 🗺️ Roadmap

- [ ] Mobile applications (iOS/Android)
- [ ] Advanced analytics and reporting
- [ ] Multi-currency support
- [ ] Advanced scheduling features
- [ ] Integration with third-party services
- [ ] Machine learning recommendations
- [ ] Multi-language support

---

Built with ❤️ using Spring Boot and Next.js
