# 🌧️ IDFLab - Frontend

This repository contains the frontend source code for a web platform designed to analyze extreme rainfall events and generate Intensity-Duration-Frequency (IDF) curves. 

This user interface was built to be responsive and modular, allowing researchers, engineers, and students to interact with complex climate data intuitively.

## ✨ Key Features

The interface guides the user through a complete workflow, from data selection to exporting results:

 - Interactive Map: Search and select meteorological stations from the INMET and CEMADEN networks.

 - Data Visualization: Interactive charts for analyzing raw and processed rainfall time series.

 - Data Quality & Treatment: Visual tools for consistency verification (e.g., Double Mass Curve) and automatic gap filling using the Random Forest algorithm.

 - IDF Curve Generation: Generation of historical IDF curves with automated or manual selection of the best-fitting probability distribution.

 - Future Scenarios: Projection and visual comparison with future climate scenarios based on the CLIMBra dataset (including bias correction).

 - Project Workspace: A logged-in dashboard to view history, manage saved projects (CRUD), and monitor background processing task statuses.

 - Exporting: Export generated results (rainfall intensities and model parameters) in CSV/Excel formats, and download technical reports as PDFs.

 - Accessibility & Localization: Native support for Dark Mode toggle and dynamic language switching between English and Portuguese (PT-BR).

## 🛠️ Technology Stack

 - Framework: Angular

 - Data Visualization: Apache ECharts

 - Authentication: Session management via JWT (JSON Web Token)

 - Architectural Context: This frontend consumes a RESTful API. The complete project ecosystem also includes a backend built with FastAPI (Python), a PostgreSQL database with the TimescaleDB extension for time-series data, asynchronous processing powered by Celery + Redis, and object storage via CloudFlare R2.

## 🚀 How to run the project locally

1. Clone this repository: 

```bash
git clone https://github.com/plcrisp/idflab-frontend.git
```

2. Navigate to the project directory:

```bash
cd idflab-frontend
```

3. Install the dependencies: 

```bash
npm install
```

4. Start the development server:

```bash
ng serve --open
```
