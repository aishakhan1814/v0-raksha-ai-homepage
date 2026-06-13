import os
import json

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

# Configuration
REGION = os.getenv('AWS_REGION', 'ap-south-1')
DONORS_TABLE = os.getenv('DONORS_TABLE', 'donors')
REQUESTS_TABLE = os.getenv('REQUESTS_TABLE', 'blood_requests')

# Initialize DynamoDB resource
# Attempts local endpoint if STAGE is local/dev, or uses default boto3 behavior.
def get_dynamodb():
    if not BOTO3_AVAILABLE:
        return None
    try:
        # Check if local DynamoDB is running (standard port 8000)
        # In a real environment, developers can set DYNAMODB_ENDPOINT
        endpoint_url = os.getenv('DYNAMODB_ENDPOINT', None)
        if endpoint_url:
            print(f"Connecting to DynamoDB at {endpoint_url}")
            return boto3.resource('dynamodb', region_name=REGION, endpoint_url=endpoint_url)
        return boto3.resource('dynamodb', region_name=REGION)
    except Exception as e:
        print(f"Error initializing DynamoDB resource: {e}")
        return None

# Seed Data Definition
donors = [
    {
        "firstName": "Ramesh", "lastName": "R.", "phone": "+919999999999", "email": "ramesh.r@email.com",
        "age": 32, "gender": "Male", "bloodType": "O+", "state": "Telangana", "city": "Hyderabad",
        "lastDonated": "2026-04-18", "donationCount": 18, "weight": 74.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays", "emergencies"], "preferredTime": "Morning",
        "maxDistance": "15km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-O+-RR9999"
    },
    {
        "firstName": "Suresh", "lastName": "K.", "phone": "+918888888888", "email": "suresh.k@email.com",
        "age": 29, "gender": "Male", "bloodType": "B+", "state": "Telangana", "city": "Hyderabad",
        "lastDonated": "2025-12-12", "donationCount": 11, "weight": 82.5, "hasConditions": "no",
        "conditions": None, "availability": ["weekends", "emergencies"], "preferredTime": "Anytime",
        "maxDistance": "25km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-B+-SK8888"
    },
    {
        "firstName": "Anita", "lastName": "M.", "phone": "+917777777777", "email": "anita.m@email.com",
        "age": 27, "gender": "Female", "bloodType": "O+", "state": "Telangana", "city": "Secunderabad",
        "lastDonated": "2025-08-01", "donationCount": 7, "weight": 61.2, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays"], "preferredTime": "Afternoon",
        "maxDistance": "10km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-O+-AM7777"
    },
    {
        "firstName": "Sunita", "lastName": "K.", "phone": "+919812345678", "email": "sunita.k@email.com",
        "age": 35, "gender": "Female", "bloodType": "A+", "state": "Delhi", "city": "Delhi",
        "lastDonated": "2026-05-10", "donationCount": 12, "weight": 58.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays", "weekends"], "preferredTime": "Evening",
        "maxDistance": "15km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-A+-SK1234"
    },
    {
        "firstName": "Priya", "lastName": "S.", "phone": "+919930123456", "email": "priya.s@email.com",
        "age": 28, "gender": "Female", "bloodType": "AB+", "state": "Maharashtra", "city": "Mumbai",
        "lastDonated": "2026-05-20", "donationCount": 6, "weight": 55.4, "hasConditions": "no",
        "conditions": None, "availability": ["weekends", "emergencies"], "preferredTime": "Morning",
        "maxDistance": "20km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-AB+-PS3012"
    },
    {
        "firstName": "Vikram", "lastName": "M.", "phone": "+919820123456", "email": "vikram.m@email.com",
        "age": 34, "gender": "Male", "bloodType": "O-", "state": "Maharashtra", "city": "Pune",
        "lastDonated": "2026-03-15", "donationCount": 14, "weight": 78.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays", "emergencies"], "preferredTime": "Anytime",
        "maxDistance": "30km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-O--VM2012"
    },
    {
        "firstName": "Ravi", "lastName": "K.", "phone": "+919011122334", "email": "ravi.k@email.com",
        "age": 31, "gender": "Male", "bloodType": "B-", "state": "Maharashtra", "city": "Nagpur",
        "lastDonated": "2026-02-10", "donationCount": 4, "weight": 70.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekends"], "preferredTime": "Afternoon",
        "maxDistance": "10km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-B--RK1112"
    },
    {
        "firstName": "Kiran", "lastName": "S.", "phone": "+919414012345", "email": "kiran.s@email.com",
        "age": 30, "gender": "Male", "bloodType": "A-", "state": "Rajasthan", "city": "Jaipur",
        "lastDonated": "2026-04-05", "donationCount": 5, "weight": 65.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays", "emergencies"], "preferredTime": "Morning",
        "maxDistance": "15km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-A--KS1401"
    },
    {
        "firstName": "Anjali", "lastName": "D.", "phone": "+919886012345", "email": "anjali.d@email.com",
        "age": 26, "gender": "Female", "bloodType": "B+", "state": "Karnataka", "city": "Bangalore",
        "lastDonated": "2026-05-01", "donationCount": 8, "weight": 54.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays", "weekends"], "preferredTime": "Evening",
        "maxDistance": "15km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-B+-AD8860"
    },
    {
        "firstName": "Lakshmi", "lastName": "N.", "phone": "+919444012345", "email": "lakshmi.n@email.com",
        "age": 33, "gender": "Female", "bloodType": "O+", "state": "Tamil Nadu", "city": "Chennai",
        "lastDonated": "2026-01-20", "donationCount": 9, "weight": 52.8, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays"], "preferredTime": "Morning",
        "maxDistance": "12km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-O+-LN4440"
    },
    {
        "firstName": "Rajesh", "lastName": "V.", "phone": "+919830012345", "email": "rajesh.v@email.com",
        "age": 36, "gender": "Male", "bloodType": "A+", "state": "West Bengal", "city": "Kolkata",
        "lastDonated": "2026-03-01", "donationCount": 10, "weight": 69.5, "hasConditions": "no",
        "conditions": None, "availability": ["weekends", "emergencies"], "preferredTime": "Anytime",
        "maxDistance": "20km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-A+-RV8300"
    },
    {
        "firstName": "Amit", "lastName": "P.", "phone": "+919879012345", "email": "amit.p@email.com",
        "age": 32, "gender": "Male", "bloodType": "O-", "state": "Gujarat", "city": "Ahmedabad",
        "lastDonated": "2026-05-15", "donationCount": 3, "weight": 72.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays", "emergencies"], "preferredTime": "Afternoon",
        "maxDistance": "25km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-O--AP8790"
    },
    {
        "firstName": "Meera", "lastName": "T.", "phone": "+919000123456", "email": "meera.t@email.com",
        "age": 25, "gender": "Female", "bloodType": "B+", "state": "Telangana", "city": "Hyderabad",
        "lastDonated": "2026-05-05", "donationCount": 6, "weight": 60.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekends"], "preferredTime": "Evening",
        "maxDistance": "10km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-B+-MT0001"
    },
    {
        "firstName": "Sanjay", "lastName": "J.", "phone": "+919811122334", "email": "sanjay.j@email.com",
        "age": 38, "gender": "Male", "bloodType": "AB-", "state": "Delhi", "city": "Delhi",
        "lastDonated": "2026-02-28", "donationCount": 7, "weight": 76.5, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays"], "preferredTime": "Morning",
        "maxDistance": "15km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-AB--SJ1112"
    },
    {
        "firstName": "Divya", "lastName": "R.", "phone": "+919920112233", "email": "divya.r@email.com",
        "age": 29, "gender": "Female", "bloodType": "O+", "state": "Maharashtra", "city": "Mumbai",
        "lastDonated": "2026-04-12", "donationCount": 5, "weight": 53.2, "hasConditions": "no",
        "conditions": None, "availability": ["weekends", "emergencies"], "preferredTime": "Morning",
        "maxDistance": "15km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-O+-DR9201"
    },
    {
        "firstName": "Karthik", "lastName": "G.", "phone": "+919845012345", "email": "karthik.g@email.com",
        "age": 31, "gender": "Male", "bloodType": "B+", "state": "Karnataka", "city": "Bangalore",
        "lastDonated": "2026-03-22", "donationCount": 12, "weight": 80.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays", "emergencies"], "preferredTime": "Anytime",
        "maxDistance": "20km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-B+-KG8450"
    },
    {
        "firstName": "Neha", "lastName": "A.", "phone": "+919860123456", "email": "neha.a@email.com",
        "age": 27, "gender": "Female", "bloodType": "A+", "state": "Maharashtra", "city": "Pune",
        "lastDonated": "2026-05-18", "donationCount": 4, "weight": 56.5, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays"], "preferredTime": "Afternoon",
        "maxDistance": "8km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-A+-NA8601"
    },
    {
        "firstName": "Sandeep", "lastName": "B.", "phone": "+919000776655", "email": "sandeep.b@email.com",
        "age": 34, "gender": "Male", "bloodType": "O+", "state": "Telangana", "city": "Hyderabad",
        "lastDonated": "2026-04-20", "donationCount": 15, "weight": 85.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays", "weekends", "emergencies"], "preferredTime": "Anytime",
        "maxDistance": "25km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-O+-SB0007"
    },
    {
        "firstName": "Poonam", "lastName": "W.", "phone": "+919111223344", "email": "poonam.w@email.com",
        "age": 28, "gender": "Female", "bloodType": "B-", "state": "Telangana", "city": "Secunderabad",
        "lastDonated": "2026-01-15", "donationCount": 3, "weight": 59.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekends"], "preferredTime": "Morning",
        "maxDistance": "15km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-B--PW1112"
    },
    {
        "firstName": "Rahul", "lastName": "C.", "phone": "+919555667788", "email": "rahul.c@email.com",
        "age": 30, "gender": "Male", "bloodType": "AB+", "state": "Telangana", "city": "Hyderabad",
        "lastDonated": "2026-04-30", "donationCount": 8, "weight": 73.0, "hasConditions": "no",
        "conditions": None, "availability": ["weekdays", "emergencies"], "preferredTime": "Evening",
        "maxDistance": "20km", "consentShare": True, "consentNotify": True, "consentData": True, "consentAge": True,
        "donorId": "RKD-AB+-RC5556"
    }
]

patients = [
    {
        "firstName": "Arjun", "lastName": "Sharma", "dob": "2017-06-15", "gender": "Male",
        "address": "Flat 302, Green Meadows, Gachibowli, Hyderabad", "phone": "+919876543210", "email": "sharma.family@email.com",
        "parentName": "Priya Sharma", "parentPhone": "+919876543211", "diagnosis": "Thalassemia Major",
        "bloodGroup": "B+", "transfusionFreq": "Every 21 days", "hospital": "Rainbow Thalassemia Centre",
        "hematologist": "Dr. Meera Iyer", "lastHb": "7.6", "medications": "Deferasirox, Folic Acid",
        "complication": ["None"], "source": "Referral", "emergencyName": "Suresh Sharma",
        "emergencyPhone": "+919876543212", "emergencyRelation": "Father", "donorCount": "3",
        "notif": ["SMS", "WhatsApp"], "consent1": True, "consent2": True,
        "requestId": "RKSH-ARJUN9"
    },
    {
        "firstName": "Karthik", "lastName": "Reddy", "dob": "2017-02-14", "gender": "Male",
        "address": "Reddy Residency, Kothrud, Pune", "phone": "+919988776655", "email": "karthik.r@email.com",
        "parentName": "Lakshmi Reddy", "parentPhone": "+919988776656", "diagnosis": "Thalassemia Major",
        "bloodGroup": "O+", "transfusionFreq": "Every 15 days", "hospital": "Sassoon Hospital",
        "hematologist": "Dr. A. K. Joshi", "lastHb": "7.1", "medications": "Deferoxamine",
        "complication": ["Febrile Reactions"], "source": "Direct Request", "emergencyName": "Venkata Reddy",
        "emergencyPhone": "+919988776657", "emergencyRelation": "Father", "donorCount": "2",
        "notif": ["WhatsApp"], "consent1": True, "consent2": True,
        "requestId": "RKSH-KARTHIK9"
    },
    {
        "firstName": "Kiran", "lastName": "Patel", "dob": "2021-09-10", "gender": "Male",
        "address": "Patel Park, Satellite, Ahmedabad", "phone": "+919123456780", "email": "kiran.patel@email.com",
        "parentName": "Anjali Patel", "parentPhone": "+919123456781", "diagnosis": "Thalassemia Major",
        "bloodGroup": "A+", "transfusionFreq": "Every 28 days", "hospital": "Civil Hospital",
        "hematologist": "Dr. Sandeep Shah", "lastHb": "6.8", "medications": "Folic Acid",
        "complication": ["None"], "source": "Partner Clinic", "emergencyName": "Bharat Patel",
        "emergencyPhone": "+919123456782", "emergencyRelation": "Father", "donorCount": "2",
        "notif": ["SMS"], "consent1": True, "consent2": True,
        "requestId": "RKSH-KIRAN5"
    },
    {
        "firstName": "Meera", "lastName": "Kumar", "dob": "2015-11-20", "gender": "Female",
        "address": "12, Gandhi Street, Mylapore, Chennai", "phone": "+919840123456", "email": "meera.kumar@email.com",
        "parentName": "Suresh Kumar", "parentPhone": "+919840123457", "diagnosis": "Thalassemia Major",
        "bloodGroup": "AB+", "transfusionFreq": "Every 15 days", "hospital": "Rajiv Gandhi Govt Hospital",
        "hematologist": "Dr. V. Rajan", "lastHb": "7.3", "medications": "Deferiprone",
        "complication": ["Mild Alloimmunization"], "source": "Hospital Referral", "emergencyName": "Janaki Kumar",
        "emergencyPhone": "+919840123458", "emergencyRelation": "Mother", "donorCount": "4",
        "notif": ["WhatsApp", "Call"], "consent1": True, "consent2": True,
        "requestId": "RKSH-MEERA11"
    },
    {
        "firstName": "Rohan", "lastName": "Shah", "dob": "2019-04-05", "gender": "Male",
        "address": "Shah Apartments, Dadar, Mumbai", "phone": "+919930112233", "email": "rohan.shah@email.com",
        "parentName": "Rita Shah", "parentPhone": "+919930112234", "diagnosis": "Thalassemia Major",
        "bloodGroup": "B+", "transfusionFreq": "Every 21 days", "hospital": "KEM Hospital",
        "hematologist": "Dr. N. K. Mehta", "lastHb": "7.0", "medications": "Deferasirox",
        "complication": ["None"], "source": "Self", "emergencyName": "Anil Shah",
        "emergencyPhone": "+919930112235", "emergencyRelation": "Father", "donorCount": "3",
        "notif": ["SMS", "WhatsApp"], "consent1": True, "consent2": True,
        "requestId": "RKSH-ROHAN7"
    }
]

# Ensure weight and age are correct types
for d in donors:
    d['age'] = int(d['age'])
    d['weight'] = float(d['weight'])
    d['donationCount'] = int(d['donationCount'])

# Create Tables if needed and Seed
def create_table_if_not_exists(dynamodb, table_name, key_name):
    try:
        table = dynamodb.Table(table_name)
        # Check if table exists
        table.table_status
        print(f"Table '{table_name}' already exists.")
        return table
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Table '{table_name}' does not exist. Creating...")
            # Create Table
            try:
                table = dynamodb.create_table(
                    TableName=table_name,
                    KeySchema=[
                        {'AttributeName': key_name, 'KeyType': 'HASH'}
                    ],
                    AttributeDefinitions=[
                        {'AttributeName': key_name, 'AttributeType': 'S'}
                    ],
                    ProvisionedThroughput={
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                )
                # Wait for table to be created
                table.meta.client.get_waiter('table_exists').wait(TableName=table_name)
                print(f"Table '{table_name}' created successfully.")
                return table
            except Exception as ce:
                print(f"Failed to create table '{table_name}': {ce}")
                return None
        else:
            print(f"Error checking table '{table_name}': {e}")
            return None

def seed_data():
    # 1. Save JSON fallback to public folder
    public_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../public'))
    os.makedirs(public_dir, exist_ok=True)
    fallback_path = os.path.join(public_dir, 'seed_data.json')
    
    # Store floats/decimals as standard JSON types
    fallback_data = {
        "donors": donors,
        "patients": patients
    }
    with open(fallback_path, 'w', encoding='utf-8') as f:
        json.dump(fallback_data, f, indent=2)
    print(f"Successfully wrote local seed fallback to {fallback_path}")

    # 2. Seed DynamoDB if connected
    if not BOTO3_AVAILABLE:
        print("boto3 is not installed. Local JSON fallback created. Seeding completed offline.")
        return

    dynamodb = get_dynamodb()
    if not dynamodb:
        print("DynamoDB is offline. Local JSON fallback created. Seeding completed offline.")
        return

    # Seed Donors
    donors_table = create_table_if_not_exists(dynamodb, DONORS_TABLE, 'donorId')
    if donors_table:
        print(f"Seeding '{DONORS_TABLE}'...")
        # boto3 put_item requires floats to be Decimal in DynamoDB
        from decimal import Decimal
        try:
            with donors_table.batch_writer() as batch:
                for d in donors:
                    # Convert weight to Decimal for DynamoDB compat
                    item = json.loads(json.dumps(d), parse_float=Decimal)
                    batch.put_item(Item=item)
            print(f"Successfully seeded {len(donors)} donors.")
        except Exception as e:
            print(f"Error seeding donors in DynamoDB: {e}")

    # Seed Patient Requests
    requests_table = create_table_if_not_exists(dynamodb, REQUESTS_TABLE, 'requestId')
    if requests_table:
        print(f"Seeding '{REQUESTS_TABLE}'...")
        try:
            with requests_table.batch_writer() as batch:
                for p in patients:
                    item = json.loads(json.dumps(p))
                    batch.put_item(Item=item)
            print(f"Successfully seeded {len(patients)} blood requests/patients.")
        except Exception as e:
            print(f"Error seeding patient requests in DynamoDB: {e}")

if __name__ == '__main__':
    seed_data()
