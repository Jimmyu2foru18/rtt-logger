const AWS = require('aws-sdk');
const fs = require('fs');

// AWS Configuration
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize AWS services
const lambda = new AWS.Lambda();
const apigateway = new AWS.APIGateway();
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();

async function deployLambdaFunction(functionName, handlerFile) {
    const functionCode = fs.readFileSync(handlerFile);
    
    const params = {
        FunctionName: functionName,
        Runtime: 'python3.8',
        Role: process.env.LAMBDA_ROLE_ARN,
        Handler: 'index.handler',
        Code: {
            ZipFile: functionCode
        },
        Environment: {
            Variables: {
                DYNAMODB_TABLE: process.env.DYNAMODB_TABLE,
                S3_BUCKET: process.env.S3_BUCKET
            }
        }
    };

    try {
        await lambda.createFunction(params).promise();
        console.log(`Successfully deployed ${functionName}`);
    } catch (error) {
        console.error(`Error deploying ${functionName}:`, error);
    }
}

// Deploy script
async function deploy() {
    // Deploy Lambda functions
    await deployLambdaFunction('rtt-udp-handler', './lambda/udp_handler.zip');
    await deployLambdaFunction('rtt-rest-handler', './lambda/rest_handler.zip');

    // Create DynamoDB table
    const tableParams = {
        TableName: process.env.DYNAMODB_TABLE,
        KeySchema: [
            { AttributeName: 'clientId', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'clientId', AttributeType: 'S' },
            { AttributeName: 'timestamp', AttributeType: 'N' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    try {
        await dynamodb.createTable(tableParams).promise();
        console.log('DynamoDB table created successfully');
    } catch (error) {
        console.error('Error creating DynamoDB table:', error);
    }
}

// Run deployment
deploy(); 