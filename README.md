# Stock Watcher API - DevOps Pipeline

A containerized Node.js microservice orchestrated with an 8-stage Jenkins declarative pipeline, deploying to a Kubernetes (K8s) cluster.

## 🚀 System Architecture
*   **App Stack:** Node.js, Express, MongoDB.
*   **Infrastructure:** Docker, Kubernetes (Dual-namespace: Staging/Production).
*   **CI/CD:** Jenkins (Groovy DSL).
*   **Security & Quality:** Snyk, Mocha, Supertest, npm audit.

---

## 🛠 CI/CD Pipeline Stages

The pipeline is designed with a **"Shift-Left"** philosophy, ensuring security and quality are validated before any infrastructure is provisioned.

1.  **Build:** Resolves dependencies using `npm install` and primes the workspace.
2.  **Test:** Executes integration tests using Mocha/Supertest to catch logic errors early.
3.  **Code Quality:** Runs `npm audit` to verify dependency health and identify code smells.
4.  **Security:** Scans for high-severity vulnerabilities using **Snyk CLI**.
5.  **Package:** Builds an immutable Docker image with unique branch-build tagging and pushes to Docker Hub.
6.  **Deploy to Staging:** Automated deployment to the `staging` namespace via `kubectl` for QA verification.
7.  **Release Promotion:** A manual approval gate on the `main` branch that promotes the verified build to `production` and performs **Automated Git Tagging** (e.g., `v1.0.15`).
8.  **Monitoring:** A resilience stage that polls the K8s `/health` endpoint to verify the MongoDB handshake and logs live telemetry.

---

## 📊 Observability & Monitoring
*   **Cluster Visibility:** Integrated with **Headlamp** for real-time pod metrics, logs, and resource tracking.
*   **Automated Alerting:** A global `post` block sends **Rich HTML Email Notifications** upon build success or failure, including live telemetry snippets.
*   **Self-Healing Verification:** Uses `kubectl rollout status` to ensure deployments are fully functional before marking a build as successful.

---

## 🛠 Local Setup & Installation

### Prerequisites
*   Jenkins with Docker and Kubernetes CLI plugins installed.
*   A running Kubernetes cluster (e.g., Minikube or MicroK8s).
*   Snyk API Token and Docker Hub credentials configured in Jenkins.
*   Finnhub Stock API

### Pipeline Configuration
1.  Clone this repository.
2.  Configure the following **Credentials** in Jenkins:
    *   `docker-hub-creds`: Docker Hub Username/Password.
    *   `finnhub-api-key`: Finnhub Stock API Secret.
    *   `github-leo-token`: GitHub PAT for automated tagging.
3.  Create a **Multibranch Pipeline** job pointing to this repository.
4.  Run the pipeline to initiate the first build.

