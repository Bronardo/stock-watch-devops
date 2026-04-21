# Stock-Watch: Real-Time Financial Microservice
### DevOps Pipeline

## 1. Project Description
**Stock-Watch** is a high-performance Node.js microservice designed to fetch and present real-time financial market data. Leveraging the **Finnhub.io REST API**, the application allows users to query current stock prices, daily highs, and lows for any global ticker symbol. 

The project is built specifically to demonstrate a **production-grade CI/CD lifecycle** using Jenkins. It transitions from local development to a containerized Kubernetes deployment, integrating automated gates for code health, security vulnerabilities, and operational monitoring.

## 2. Technical Stack
* **Runtime:** Node.js (v20+)
* **Framework:** Express.js
* **Communication:** Axios (REST API Integration)
* **Testing:** Mocha & Chai (Unit & Integration Testing)
* **Containerization:** Docker & Docker Compose
* **Orchestration:** Kubernetes (k3s)
* **CI/CD:** Jenkins (Pipeline-as-Code)

## 3. Pipeline Stages (7 Stages Implemented)
To achieve a **Top HD** grade, this pipeline implements all seven stages of the DevOps lifecycle with full automation:

| # | Stage | Tools Used | Description |
|---|---|---|---|
| 1 | **Build** | Docker | Generates a multi-stage production Docker image. |
| 2 | **Test** | Mocha / Chai | Executes unit tests for API routing and data parsing. |
| 3 | **Code Quality** | SonarQube | Scans for code smells, duplication, and complexity. |
| 4 | **Security** | Snyk / Trivy | Scans dependencies and container layers for CVEs. |
| 5 | **Deploy** | Docker Compose | Deploys the image to a staging/test environment. |
| 6 | **Release** | Git Tags / Docker Hub | Versions the artifact and promotes it to the registry. |
| 7 | **Monitoring** | Prometheus / Alertmanager | Monitors endpoint health and simulates rate-limit alerts. |

## 4. Setup Instructions
1. **Clone the repository:**
   `git clone https://github.com/Bronardo/stock-watch-devops.git`
2. **Environment Variables:**
   Copy `.env.example` to `.env` and add your `FINNHUB_KEY`.
3. **Local Run:**
   `npm install && npm start`