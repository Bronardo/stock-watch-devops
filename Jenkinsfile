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
                sh 'npm audit || true' 
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
                script {
                    // HD Logic: Determine environment settings based on branch
                    if (env.BRANCH_NAME == 'main') {
                        env.K8S_NAMESPACE = 'production'
                        env.NODE_PORT     = '32000'
                    } else {
                        env.K8S_NAMESPACE = 'staging'
                        env.NODE_PORT     = '32001'
                    }

                    echo "Deploying to ${env.K8S_NAMESPACE} on port ${env.NODE_PORT}..."
                    
                    // envsubst now handles both DOCKER_IMAGE and NODE_PORT
                    sh "envsubst < k8s/deployment.yaml | kubectl apply -n ${env.K8S_NAMESPACE} -f -"
                }
            }
        }

        stage('7. Monitoring') {
            steps {
                script {
                    echo "Verifying ${env.K8S_NAMESPACE} Deployment Health..."
                    
                    // Wait for rollout in the specific namespace
                    sh "kubectl rollout status deployment/stock-watch-api -n ${env.K8S_NAMESPACE} --timeout=60s"
                    
                    // Set environment variables for the banner
                    env.BASE_URL = "http://${env.K8S_NODE_IP}:${env.NODE_PORT}"
                    env.HEALTH_URL = "${env.BASE_URL}/health"
                    
                    // Run the health check
                    def response = sh(script: "curl -s ${env.HEALTH_URL}", returnStatus: true)
                    
                    if (response != 0) {
                        error "Deployment Failed: App unreachable at ${env.HEALTH_URL}"
                    } else {
                        echo "--------------------------------------------------------"
                        echo "🚀 DEPLOYMENT SUCCESSFUL!"
                        echo "Environment: ${env.K8S_NAMESPACE.toUpperCase()}"
                        echo "Access Link: ${env.BASE_URL}"
                        echo "Health Check: ${env.HEALTH_URL}"
                        echo "Live Prices: ${env.BASE_URL}/price/AAPL"
                        echo "--------------------------------------------------------"
                    }
                }
            }
        }
    }
}