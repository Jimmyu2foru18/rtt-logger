/* AWS Configuration File
const awsConfig = {
    // Lambda Function Configuration
    lambda: {
        region: 'YOUR_REGION',
        functionName: 'rtt-logger-function',
        handler: 'udp_server.lambda_handler',
        runtime: 'python3.8',
        timeout: 30,
        memorySize: 256
    },

    // API Gateway Configuration
    apiGateway: {
        name: 'RTTLogger-API',
        stage: 'prod',
        websocketApi: true
    },

    // DynamoDB Configuration
    dynamodb: {
        tableName: 'rtt_logs',
        readCapacity: 5,
        writeCapacity: 5,
        streamEnabled: true,
        cacheConfig: {
            enabled: true,
            ttl: 3600,
            size: 100
        }
    },

    // S3 Configuration
    s3: {
        dataBucket: 'rtt-logger-data',
        backupBucket: 'rtt-logger-backups',
        logRetention: 30 // days
    },

    // Cognito Configuration
    cognito: {
        userPoolName: 'RTTLogger-Users',
        clientName: 'RTTLogger-Client',
        passwordPolicy: {
            minLength: 8,
            requireNumbers: true,
            requireSpecialChars: true,
            requireUppercase: true,
            requireLowercase: true
        }
    },

    // CloudWatch Configuration
    cloudWatch: {
        logRetention: 14, // days
        metricNamespace: 'RTTLogger',
        alarms: {
            highLatency: {
                threshold: 1000, // ms
                evaluationPeriods: 3
            },
            errorRate: {
                threshold: 5, // percent
                evaluationPeriods: 5
            }
        },
        performanceMetrics: {
            enabled: true,
            sampleRate: 0.1
        }
    },

    // IAM Roles and Policies
    iam: {
        roleName: 'RTTLogger-Role',
        policies: [
            'AWSLambdaBasicExecutionRole',
            'AWSLambdaVPCAccessExecutionRole',
            'AWSLambdaDynamoDBExecutionRole'
        ]
    }
};

export default awsConfig; */ 