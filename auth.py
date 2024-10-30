import jwt
import time
from functools import wraps
from flask import request, jsonify
import boto3
from botocore.exceptions import ClientError

class Auth:
    def __init__(self, app):
        self.app = app
        self.cognito = boto3.client('cognito-idp')
        self.user_pool_id = app.config['COGNITO_USER_POOL_ID']
        self.client_id = app.config['COGNITO_CLIENT_ID']

    def require_auth(self, f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None

            if 'Authorization' in request.headers:
                token = request.headers['Authorization'].split(" ")[1]

            if not token:
                return jsonify({'message': 'Token is missing'}), 401

            try:
                # Verify token with Cognito
                response = self.cognito.get_user(
                    AccessToken=token
                )
                return f(*args, **kwargs)
            except ClientError as e:
                return jsonify({'message': 'Token is invalid'}), 401

        return decorated

    def login(self, username, password):
        try:
            response = self.cognito.initiate_auth(
                ClientId=self.client_id,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': username,
                    'PASSWORD': password
                }
            )
            return response['AuthenticationResult']
        except ClientError as e:
            raise Exception(f"Authentication failed: {str(e)}") 