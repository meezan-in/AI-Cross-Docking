# Cross-Docking Logistics Management System

A comprehensive, AI-powered logistics management platform designed for efficient cross-docking operations, fleet management, and route optimization. This system provides real-time tracking, intelligent fleet assignment, and advanced analytics for logistics operations across Indian cities.

## 🚀 Project Overview

This cross-docking logistics system is a full-stack application that streamlines package handling, fleet management, and delivery operations. It features AI-powered optimization algorithms, real-time IoT integration, and a modern web interface for comprehensive logistics management.

### Key Features

- **AI-Powered Fleet Assignment**: Intelligent algorithms for optimal vehicle-package matching
- **Real-time ETA Prediction**: Machine learning models for accurate delivery time estimation
- **Route Optimization**: Advanced TSP (Traveling Salesman Problem) solver for efficient routing
- **IoT Integration**: RFID and sensor data integration via Blynk platform
- **Real-time Analytics**: Comprehensive dashboards with performance metrics
- **Multi-modal Fleet Management**: Support for various vehicle types and capacities
- **Priority-based Dispatch**: Intelligent handling of urgent and high-priority packages

## 🛠 Technology Stack

### Frontend

- **React 18** - Modern UI framework with TypeScript
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Query (TanStack Query)** - Server state management
- **Chart.js** - Data visualization and analytics
- **Leaflet** - Interactive maps and route visualization
- **Framer Motion** - Smooth animations and transitions
- **Wouter** - Lightweight routing solution

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript development
- **MongoDB** - NoSQL database with MongoDB Atlas
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing and security
- **Multer** - File upload handling
- **WebSocket** - Real-time communication

### AI/ML Components

- **Python** - AI model development and execution
- **scikit-learn** - Machine learning algorithms
- **joblib** - Model serialization and loading
- **OR-Tools (Google)** - Route optimization and TSP solving
- **NumPy & Pandas** - Data manipulation and analysis

### DevOps & Tools

- **Drizzle ORM** - Type-safe database operations
- **ESBuild** - Fast JavaScript bundler
- **PostCSS** - CSS processing
- **Concurrently** - Parallel script execution
- **Cross-env** - Cross-platform environment variables

## 🏗 Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (React/TS)    │◄──►│   (Express/TS)  │◄──►│   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │    │   Blynk IoT     │    │   File Storage  │
│   Atlas         │    │   Platform      │    │   (CSV/JSON)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Package Creation**: Manual entry or IoT sensor data via Blynk
2. **AI Processing**: Fleet assignment and route optimization
3. **Real-time Updates**: WebSocket connections for live status updates
4. **Analytics**: Performance metrics and efficiency reporting

## 📊 Core Functionality

### 1. Package Management

- **Multi-source Input**: Manual entry and RFID sensor integration
- **Priority Classification**: Low, Medium, High, Urgent priority levels
- **Status Tracking**: Pending → Assigned → In Transit → Delivered
- **Bulk Operations**: CSV import/export for large datasets

### 2. Fleet Management

- **Vehicle Types**: Small, Medium, Large, Container, Refrigerated trucks
- **Capacity Tracking**: Real-time capacity utilization monitoring
- **Status Management**: Available, Loading, En Route, Maintenance states
- **Location Tracking**: Current location and destination management

### 3. AI-Powered Assignment

- **Intelligent Matching**: Multi-factor scoring algorithm
- **Distance Optimization**: Haversine formula for accurate distance calculation
- **Capacity Utilization**: Optimal vehicle-package matching
- **Priority Weighting**: Urgent packages get higher assignment priority

### 4. Route Optimization

- **TSP Solver**: Google OR-Tools for optimal route calculation
- **Multi-stop Routing**: Efficient handling of multiple destinations
- **Real-time Updates**: Dynamic route adjustments based on conditions
- **Visual Mapping**: Interactive route visualization with Leaflet

### 5. ETA Prediction

- **ML Models**: Trained models for accurate delivery time estimation
- **Multi-factor Analysis**: Distance, weight, priority, traffic conditions
- **Real-time Countdown**: Live ETA tracking for dispatched packages
- **Traffic Integration**: Dynamic traffic level consideration

## 🎯 Efficiency Features

### Performance Optimization

- **Caching Strategy**: React Query for efficient data fetching
- **Lazy Loading**: Component and route-based code splitting
- **Optimized Bundling**: ESBuild for fast build times
- **Database Indexing**: Optimized MongoDB queries

### AI Efficiency Metrics

- **Fleet Utilization**: Maximize vehicle capacity usage
- **Route Efficiency**: Minimize total distance traveled
- **Delivery Speed**: Optimize for fastest delivery times
- **Cost Reduction**: Minimize fuel and operational costs

### Real-time Monitoring

- **Live Dashboards**: Real-time performance metrics
- **Progress Tracking**: Visual progress indicators
- **Alert System**: Notifications for critical events
- **Performance Analytics**: Historical data analysis

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18+
- Python 3.8+
- MongoDB Atlas account
- Blynk IoT platform account

### Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
BLYNK_AUTH_TOKEN=your_blynk_auth_token
DATABASE_URL=your_database_url
```

### Installation Steps

```bash
# Clone the repository
git clone <repository-url>
cd cross-docking-main

# Install dependencies
npm install

# Install Python dependencies
pip install scikit-learn joblib numpy pandas ortools

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server with backend and Blynk poller
- `npm run backend` - Start backend server only
- `npm run blynk` - Start Blynk IoT poller
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking

## 📈 Analytics & Reporting

### Key Performance Indicators

- **Fleet Utilization Rate**: Percentage of vehicle capacity used
- **Average Delivery Time**: Mean time from assignment to delivery
- **Route Efficiency**: Distance optimization metrics
- **Package Throughput**: Packages processed per time period
- **Cost per Delivery**: Operational cost analysis

### Dashboard Features

- **Real-time Metrics**: Live performance indicators
- **Historical Trends**: Time-series data visualization
- **Geographic Analysis**: Location-based performance mapping
- **Fleet Performance**: Individual vehicle efficiency tracking
- **Priority Analysis**: Performance by package priority level

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Zod schema validation for all inputs
- **Rate Limiting**: API request throttling
- **Environment Variables**: Secure configuration management

## 🌐 IoT Integration

### Blynk Platform Integration

- **RFID Sensor Data**: Automatic package detection
- **Real-time Polling**: 3-second interval data collection
- **Automatic Package Creation**: Sensor-triggered package entries
- **Error Handling**: Robust error recovery mechanisms

### Sensor Data Processing

- **Package ID**: RFID tag identification
- **Destination City**: Automated city assignment
- **Weight Measurement**: Load cell sensor integration
- **Priority Detection**: Smart priority classification

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 📱 User Interface

### Modern Design

- **Responsive Layout**: Mobile-first design approach
- **Dark/Light Theme**: User preference-based theming
- **Accessibility**: WCAG compliant components
- **Intuitive Navigation**: User-friendly interface design

### Key Components

- **Dashboard**: Centralized control panel
- **Package Management**: CRUD operations for packages
- **Fleet Management**: Vehicle tracking and management
- **Assignment Interface**: AI-powered assignment system
- **Analytics Dashboard**: Performance visualization
- **Route Visualization**: Interactive map interface

## 🔄 API Endpoints

### Package Management

- `GET /api/packages` - Retrieve all packages
- `POST /api/packages` - Create new package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package

### Fleet Management

- `GET /api/fleet` - Retrieve all fleet vehicles
- `POST /api/fleet` - Create new fleet vehicle
- `PUT /api/fleet/:id` - Update fleet vehicle
- `DELETE /api/fleet/:id` - Delete fleet vehicle

### Assignment Operations

- `POST /api/assignments` - Create assignment
- `POST /api/assignments/ai` - AI-powered assignment
- `PUT /api/assignments/:id` - Update assignment status

### Analytics

- `GET /api/analytics/summary` - Performance summary
- `GET /api/analytics/trends` - Historical trends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## 🔮 Future Enhancements

- **Machine Learning Improvements**: Enhanced prediction models
- **Mobile Application**: Native mobile app development
- **Advanced Analytics**: Predictive analytics and forecasting
- **Integration APIs**: Third-party logistics platform integration
- **Blockchain Integration**: Supply chain transparency
- **Autonomous Vehicles**: Self-driving fleet management

---

**Built with ❤️ for efficient logistics management**
