import boto3
import json
import sys

region = "ap-south-1"
dynamodb = boto3.resource('dynamodb', region_name=region)

tables = {
    "Donors": "donors",
    "Blood Requests": "blood_requests",
    "Chat Sessions": "chat_sessions"
}

print("=" * 60)
print("             RAKSHA AI - LIVE DYNAMODB VIEWER")
print("=" * 60)

for display_name, table_name in tables.items():
    print(f"\nChecking table: {table_name} ({display_name})...")
    try:
        table = dynamodb.Table(table_name)
        response = table.scan()
        items = response.get('Items', [])
        
        print(f"-> Found {len(items)} records in {table_name}.")
        if items:
            # Print first 2 items as formatted JSON for demo
            print("   Sample Data:")
            for idx, item in enumerate(items[:2], 1):
                clean_item = {k: v for k, v in item.items() if k != 'messages'}
                if 'messages' in item:
                    clean_item['message_count'] = len(item['messages'])
                print(f"   [{idx}] {json.dumps(clean_item, indent=2)}")
        else:
            print("   (Table is empty)")
    except Exception as e:
        print(f"Error querying table {table_name}: {e}")

print("\n" + "=" * 60)
