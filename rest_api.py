from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import Schema, fields, ValidationError
import sqlite3
from functools import wraps
import logging
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(
    filename='rest_api.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Rate limiting
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per minute"]
)

# Initialize X-Ray
xray_recorder.configure(service='RTTLogger-API')
XRayMiddleware(app, xray_recorder)

# Validation schemas
class RTTLogSchema(Schema):
    client_ip = fields.Str(required=True)
    rtt = fields.Float(required=True)
    packet_loss_rate = fields.Float(required=True)
    timestamp = fields.Float(required=True)

# Error handling decorator
def handle_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValidationError as e:
            return jsonify({
                'status': 'error',
                'message': 'Validation error',
                'errors': e.messages
            }), 400
        except sqlite3.Error as e:
            logging.error(f"Database error: {e}")
            return jsonify({
                'status': 'error',
                'message': 'Database error'
            }), 500
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            return jsonify({
                'status': 'error',
                'message': 'Internal server error'
            }), 500
    return wrapper

@app.route('/api/rtt/logs', methods=['GET'])
@limiter.limit("60 per minute")
@xray_recorder.capture('get_rtt_logs')
@handle_errors
def get_rtt_logs():
    """Get RTT logs with filtering"""
    schema = RTTLogSchema()
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')
    client_id = request.args.get('client_id')
    
    with sqlite3.connect('rtt_data.db') as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM rtt_logs WHERE 1=1"
        params = []
        
        if start_time:
            query += " AND timestamp >= ?"
            params.append(float(start_time))
        if end_time:
            query += " AND timestamp <= ?"
            params.append(float(end_time))
        if client_id:
            query += " AND client_ip = ?"
            params.append(client_id)
            
        cursor.execute(query, params)
        logs = cursor.fetchall()
        
    return jsonify({
        'status': 'success',
        'data': [schema.dump(log) for log in logs]
    })

# Add more endpoints with similar error handling and validation...

if __name__ == '__main__':
    app.run(debug=False, port=5000) 