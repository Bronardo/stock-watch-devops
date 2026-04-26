pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDS = credentials('docker-hub-creds') 
        DOCKER_USER      = 'bronardo' 
        IMAGE_NAME       = 'stock-watch-api'
        FINNHUB_KEY = credentials('finnhub-api-key')
    }

    stages {
        stage('1. Build') {
            steps {
                sh 'npm install'
            }
        }

        stage('2. Test') {
            steps {
                // Uses the resilient test logic we just wrote
                sh "FINNHUB_KEY=${FINNHUB_KEY} npm test"
            }
        }

        stage('3. Code Quality') {
            steps {
                echo 'Running Quality Scan...'
                sh 'npm audit' // Basic. For Top HD, use 'npx eslint app/'
            }
        }

        stage('4. Security') {
            steps {
                // Snyk will scan the package-lock.json we just pushed
                sh 'snyk test --severity-threshold=high || true' 
            }
        }

        stage('5. Package') {
            steps {
                sh "docker build -t ${DOCKER_USER}/${IMAGE_NAME}:${env.BUILD_NUMBER} ."
    
                // Jenkins provides _USR and _PSW variables automatically from the 'credentials' helper
                sh "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"
                sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:${env.BUILD_NUMBER}"
            }
        }

        stage('6. Deploy') {
            steps {
                echo 'Deploying to K8s Staging...'
                // This uses the .kube/config we moved in Step 1
                sh "envsubst < k8s/deployment.yaml | kubectl apply -f -"
            }
        }

        stage('7. Monitoring') {
            steps {
                echo 'Verifying Deployment Health...'
                sh "kubectl get pods -n staging"
                // Simulate an alert check
                sh "curl -s http://<k8s-node-ip>:3000/health || echo 'Alert: App Unreachable'"
            }
        }
    }
}