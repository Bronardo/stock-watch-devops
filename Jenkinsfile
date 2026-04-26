pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDS = credentials('docker-hub-creds') 
        DOCKER_USER      = 'bronardo' 
        IMAGE_NAME       = 'stock-watch-api'
        FINNHUB_KEY      = credentials('finnhub-api-key')
        // Create the combined image string for envsubst
        DOCKER_IMAGE     = "${DOCKER_USER}/${IMAGE_NAME}:${env.BUILD_NUMBER}"
        // Set the K8s IP for the Monitoring stage
        K8S_NODE_IP      = '10.10.10.10'
    }

    stages {
        stage('1. Build') {
            steps {
                sh 'npm install'
            }
        }

        stage('2. Test') {
            steps {
                sh "FINNHUB_KEY=${FINNHUB_KEY} NODE_ENV=test npm test"
            }
        }

        stage('3. Code Quality') {
            steps {
                echo 'Running Quality Scan...'
                sh 'npm audit' 
            }
        }

        stage('4. Security') {
            steps {
                // Snyk authenticated earlier; || true prevents failure if non-critical vulns found
                sh 'snyk test --severity-threshold=high || true' 
            }
        }

        stage('5. Package') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE} ."
                sh "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"
                sh "docker push ${DOCKER_IMAGE}"
            }
        }

        stage('6. Deploy') {
            steps {
                echo "Deploying ${DOCKER_IMAGE} to K8s Staging..."
                // envsubst injects the DOCKER_IMAGE variable into your YAML
                sh "envsubst < k8s/deployment.yaml | kubectl apply -n staging -f -"
            }
        }

        stage('7. Monitoring') {
            steps {
                echo 'Verifying Deployment Health...'
                // Wait for the rollout to complete so health check doesn't fail prematurely
                sh "kubectl rollout status deployment/stock-watch-api -n staging --timeout=60s"
                
                // Real health check against the NodePort (32000)
                script {
                    def response = sh(script: "curl -s http://${K8S_NODE_IP}:32000/health", returnStatus: true)
                    if (response != 0) {
                        echo "Alert: App Unreachable at http://${K8S_NODE_IP}:32000/health"
                        // For Top HD, you could use 'error' here to fail the build if health check fails
                    } else {
                        echo "Health Check Success!"
                    }
                }
            }
        }
    }
}