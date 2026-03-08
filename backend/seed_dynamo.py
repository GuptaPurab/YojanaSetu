"""
Seed script: uploads local schemes.json into AWS DynamoDB.
Run from: d:\Projects\YS_ANTI\backend\
"""
import json, os, sys
from pathlib import Path
import boto3
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

region     = os.getenv("AWS_REGION", "ap-south-1")
access_key = os.getenv("AWS_ACCESS_KEY_ID")
secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
table_name = os.getenv("DYNAMODB_SCHEMES_TABLE", "yojanasetu-schemes")

data_path = Path(__file__).parent / "data" / "schemes.json"

if not data_path.exists():
    print(f"❌ schemes.json not found at {data_path}")
    sys.exit(1)

with open(data_path, encoding="utf-8") as f:
    schemes = json.load(f)

print(f"📦 Loaded {len(schemes)} schemes from local JSON")
print(f"🌐 Connecting to DynamoDB table '{table_name}' in {region}...")

dynamodb = boto3.resource(
    "dynamodb",
    region_name=region,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
)
table = dynamodb.Table(table_name)

with table.batch_writer() as batch:
    for scheme in schemes:
        batch.put_item(Item=scheme)

print(f"✅ Successfully seeded {len(schemes)} schemes into DynamoDB!")
