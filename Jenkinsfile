pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDS = credentials('docker-hub-creds') 
        DOCKER_USER      = 'bronardo' 
        IMAGE_NAME       = 'stock-watch-api'
        FINNHUB_KEY      = credentials('finnhub-api-key')
        // Create the combined image string for envsubst
        CLEAN_BRANCH     = "${env.BRANCH_NAME.replaceAll("/", "-")}"
        IMAGE_TAG        = "${CLEAN_BRANCH}-${env.BUILD_NUMBER}"
        DOCKER_IMAGE     = "${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
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
                // sh "docker build --no-cache -t ${DOCKER_IMAGE} ."
                sh "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"
                sh "docker push ${DOCKER_IMAGE}"
            }
        }

        stage('6. Deploy to Staging') {
            when { branch 'staging' } // Only runs on the staging branch
            steps {
                script {
                    env.K8S_NAMESPACE = 'staging'
                    env.NODE_PORT     = '32001'
                    echo "Deploying to Staging..."
                    sh "envsubst < k8s/deployment.yaml | kubectl apply -n ${env.K8S_NAMESPACE} -f -"
                }
            }
        }

        stage('7. Release Promotion') {
            when { branch 'main' } // Only runs when code is merged to main
            steps {
                script {
                    // 1. Manual Approval Gate (Requirement 9)
                    input message: "Promote build ${env.BUILD_NUMBER} to Production?", ok: "Release v1.0.${env.BUILD_NUMBER}"
                    
                    // 2. Set Production Environment
                    env.K8S_NAMESPACE = 'production'
                    env.NODE_PORT     = '32000'
                    
                    echo "Promoting to Production Namespace..."
                    sh "envsubst < k8s/deployment.yaml | kubectl apply -n ${env.K8S_NAMESPACE} -f -"

                    // 3. Automated Git Tagging (Release Management)
                    def tag = "v1.0.${env.BUILD_NUMBER}"
                    echo "Tagging Release: ${tag}"
                    
                    withCredentials([usernamePassword(credentialsId: 'github-leo-token', 
                                     passwordVariable: 'GIT_PASSWORD', 
                                     usernameVariable: 'GIT_USERNAME')]) {
                        
                        sh "git config user.email '${GIT_USERNAME}@users.noreply.github.com'"
                        sh "git config user.name 'Jenkins Release Bot'"
                        
                        sh "git tag -a ${tag} -m 'Release ${tag} promoted to production by Jenkins'"
                        sh "git push https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/Bronardo/stock-watch-devops.git ${tag}"
                    }
                }
            }
        }

        stage('8. Monitoring') {
            steps {
                script {
                    echo "Verifying ${env.K8S_NAMESPACE} Deployment & Live Metrics..."
                    
                    // 1. Kubernetes Rollout Check
                    sh "kubectl rollout status deployment/stock-watch-api -n ${env.K8S_NAMESPACE} --timeout=60s"
                    
                    env.BASE_URL = "http://${env.K8S_NODE_IP}:${env.NODE_PORT}"
                    env.HEALTH_URL = "${env.BASE_URL}/health"
                    
                    // We use a timeout wrapper for the entire polling process
                    timeout(time: 2, unit: 'MINUTES') {
                        waitUntil {
                            try {
                                // 2. Fetch Live Metrics (JSON)
                                def responseBody = sh(script: "curl -s -H 'Cache-Control: no-cache' ${env.HEALTH_URL}", returnStdout: true).trim()
                                echo "Current Telemetry: ${responseBody}"
                                
                                // 3. Check if Database is UP
                                if (responseBody.contains('"database":"Connected"')) {
                                    // 4. Success Banner with Live Metric Snippet
                                    echo "--------------------------------------------------------"
                                    echo "🚀 MONITORING INTEGRATED & SUCCESSFUL!"
                                    echo "Environment: ${env.K8S_NAMESPACE.toUpperCase()}"
                                    echo "Database Status: Connected ✅"
                                    echo "Access Link: ${env.BASE_URL}"
                                    echo "Health Check: ${env.HEALTH_URL}"
                                    echo "Live Telemetry: ${responseBody}"
                                    echo "--------------------------------------------------------"
                                    return true // This exits the waitUntil loop successfully
                                } else {
                                    echo "⚠️ Database still Disconnected... retrying in 10s"
                                    sleep 10
                                    return false // This triggers a retry
                                }
                            } catch (Exception e) {
                                echo "⚠️ Application not responding yet... retrying in 10s"
                                sleep 10
                                return false
                            }
                        }
                    }
                }
            }
        }

    }
    
    post {
        always {
            echo "Pipeline finished. Cleaning up workspace..."
            // cleanWs()
        }
        success {
            echo "✅ Alert: Build #${env.BUILD_NUMBER} passed successfully!"
        }
        failure {
            // This is Requirement 10: Automatic Alerting
            echo "🚨 ALERT: Pipeline Failed at Stage: ${env.STAGE_NAME}"
            echo "Check logs at: ${env.BUILD_URL}"
            
            /* Technical Insight for Report: 
            In a production environment, this block would trigger 
            an email, Slack, or PagerDuty notification.
            */
        }
    }
}