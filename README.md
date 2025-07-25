# 🚚 Cross Docking Logistics Management Platform

A modern, AI-powered platform for managing cross-docking logistics, built for efficiency, scalability, and real-time operational intelligence.

---

## 🌟 Project Summary

Cross Docking Logistics Management Platform is a full-stack web application designed to streamline logistics operations for warehouses and distribution centers. It enables seamless management of packages, fleet vehicles, assignments, and route optimization, leveraging advanced AI/ML models for smart decision-making and predictive analytics.

---

## ✨ Key Features

- **Secure Admin Authentication**: Robust login and session management for authorized access.
- **Interactive Dashboard**: Real-time analytics, KPIs, and operational insights at a glance.
- **Package Management**: Add, edit, delete, bulk import/export packages via CSV.
- **Fleet Management**: Manage fleet vehicles, monitor status, and optimize utilization.
- **AI/ML-Powered Assignment**: Assign packages to fleet using intelligent optimization algorithms.
- **ETA Prediction**: Accurate delivery time estimates using machine learning.
- **Route Visualization**: Interactive maps and route analytics.
- **Scheduling & Automation**: Cron-like task scheduling for auto-dispatch and data operations.
- **Modern UI/UX**: Responsive, accessible, and visually appealing interface with dynamic effects.

---

## 🚀 Live Demo

> [Live Demo Coming Soon!]

---

## 🏗️ Architecture Overview

```
[ React + Tailwind (Frontend) ]  <-->  [ Node.js + Express (API) ]  <-->  [ MongoDB (Database) ]
                                             |
                                             |-- [ Python AI/ML Scripts (scikit-learn models) ]
```

---

## 🛠️ Tech Stack

### Frontend

- **React** (TypeScript)
- **Tailwind CSS** (utility-first styling)
- **TanStack Query** (data fetching)
- **Chart.js** & **react-chartjs-2** (analytics)
- **Lucide Icons**, **Radix UI**, **Wouter** (routing)
- **PapaParse** (CSV parsing)

### Backend

- **Node.js** + **Express.js** (RESTful API)
- **MongoDB Atlas** (cloud database)
- **csvtojson**, **json2csv** (CSV handling)

### AI/ML

- **Python 3.x**
- **scikit-learn** (model training)
- **joblib** (model serialization)
- **pandas**, **numpy** (data processing)
- **Pre-trained models**: `fleet_assign_model.pkl`, `eta_model.pkl`
- **Scripts**: `fleet_assign_predictor.py`, `eta_predictor.py`, `train_eta_model.py`, `train_fleet_assign_model.py`, `route_optimizer.py`

---

## 🤖 AI/ML Algorithms

### Fleet Assignment Optimization

- **Model:** Supervised classification (Random Forest/Logistic Regression)
- **Features:** Fleet capacity, package weight, priority
- **Usage:** Selects the optimal fleet for each package

### ETA Prediction

- **Model:** Regression (Linear Regression or similar)
- **Features:** Distance, weight, priority, traffic
- **Usage:** Predicts delivery time for each assignment

### Integration

- Node.js backend calls Python scripts for real-time predictions
- Models are trained offline and loaded at runtime

---

## 📁 Folder Structure

```
cross-docking-main/
├── ai/                # Python scripts & ML models
├── client/            # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
├── server/            # Node.js backend
├── shared/            # Shared TypeScript schemas
├── attached_assets/   # Notebooks, data, experiments
├── package.json       # Project manifest
└── README.md          # This file
```

---

## ⚡ Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/cross-docking-main.git
   cd cross-docking-main
   ```
2. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install
   ```
3. **Set up MongoDB Atlas:**
   - Create a free cluster and get your connection string
   - Add your credentials to `.env` files
4. **Start the servers:**
   ```bash
   # In project root
   npm run dev
   # In client/
   npm start
   ```
5. **(Optional) Train or update AI/ML models:**
   - Use the provided Python scripts in `ai/`

---

## 📝 Contribution Guide

We welcome contributions! To get started:

- Fork the repo and create a new branch
- Make your changes with clear commit messages
- Open a pull request with a detailed description
- Follow the code style and add tests where possible

---

## 📬 Contact & Support

- **Author:** Mohammad Meezan   
- **Email:** mohammadmeezan.in@gmail.com
- **LinkedIn:** [mohammadmeezan](https://linkedin.com/in/mohammadmeezan)


## 📄 License

This project is licensed under the MIT License.

