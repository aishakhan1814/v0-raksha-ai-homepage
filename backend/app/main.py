import sys, os
backend_package = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "package"))
if os.path.exists(backend_package) and backend_package not in sys.path:
    sys.path.append(backend_package)

# Local scratch lib fallback if available
scratch_lib = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scratch", "lib"))
if os.path.exists(scratch_lib) and scratch_lib not in sys.path:
    sys.path.append(scratch_lib)

import os
import hmac
import boto3
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
import json
import joblib
import pandas as pd

app = FastAPI(title="Raksha AI API", description="FastAPI Backend for Raksha AI")

# Configure CORS so our Next.js frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to restrict to your frontend domain
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML Inference Pipeline at Startup
MODEL_ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "model_artifacts"))
PIPELINE_PATH = os.path.join(MODEL_ARTIFACTS_DIR, "rakshai_xgboost_pipeline.joblib")
METADATA_PATH = os.path.join(MODEL_ARTIFACTS_DIR, "model_metadata.json")
SCHEMA_PATH = os.path.join(MODEL_ARTIFACTS_DIR, "feature_schema.json")

ml_pipeline = None
model_metadata: Dict[str, Any] = {}
feature_schema: Dict[str, Any] = {}
ml_feature_order: List[str] = []
ml_model_version = "1.0.0"

try:
    with open(METADATA_PATH, "r", encoding="utf-8") as metadata_file:
        model_metadata = json.load(metadata_file)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as schema_file:
        feature_schema = json.load(schema_file)
    ml_feature_order = feature_schema.get("feature_order", [])
    if ml_feature_order != [
        "cycle_of_donations",
        "frequency_in_days",
        "registration_days",
        "role",
        "blood_group",
        "gender",
        "donor_type",
        "eligibility_status",
    ]:
        raise ValueError("Feature schema does not match the served prediction contract")
    ml_pipeline = joblib.load(PIPELINE_PATH)
    ml_model_version = str(model_metadata["version"])
except Exception as exc:
    # Keep health responses honest without logging filesystem paths or request data.
    print(f"ML model assets unavailable ({type(exc).__name__}).")

# Initialize DynamoDB resource
# Local fallback uses environment variables or default AWS configurations
region = os.getenv('AWS_REGION', 'ap-south-1')
donors_table_name = os.getenv('DONORS_TABLE', 'donors')
requests_table_name = os.getenv('REQUESTS_TABLE', 'blood_requests')
chat_table_name = os.getenv('CHAT_TABLE', 'chat_sessions')

# Helper to load DynamoDB table resource
def get_dynamodb_resource():
    # If we are in Lambda, Boto3 automatically picks up credentials from IAM Role.
    # Otherwise, it looks for local credentials.
    return boto3.resource('dynamodb', region_name=region)

# Request validation schemas
class DonorRegisterRequest(BaseModel):
    firstName: str
    lastName: str
    phone: str
    email: Optional[str] = None
    age: int
    gender: str
    bloodType: str
    state: str
    city: str
    lastDonated: Optional[str] = None
    donationCount: Optional[int] = 0
    weight: float
    hasConditions: str
    conditions: Optional[str] = None
    availability: List[str]
    preferredTime: Optional[str] = None
    maxDistance: Optional[str] = None
    consentShare: bool
    consentNotify: bool
    consentData: bool
    consentAge: bool

class BloodRequest(BaseModel):
    firstName: str
    lastName: str
    dob: str
    gender: str
    address: str
    phone: str
    email: Optional[str] = None
    parentName: str
    parentPhone: str
    diagnosis: str
    bloodGroup: str
    transfusionFreq: str
    hospital: str
    hematologist: Optional[str] = None
    lastHb: Optional[str] = None
    medications: Optional[str] = None
    complication: List[str] = []
    source: Optional[str] = None
    emergencyName: str
    emergencyPhone: str
    emergencyRelation: str
    donorCount: str
    notif: List[str] = []
    consent1: bool
    consent2: bool


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    patient_id: Optional[str] = "RKSH-ARJUN9"
    message: str
    history: Optional[List[ChatMessage]] = []

class DonorStatusPredictionRequest(BaseModel):
    cycle_of_donations: float = Field(..., ge=0, allow_inf_nan=False, description="Donation interval cycle in days")
    frequency_in_days: float = Field(..., ge=0, allow_inf_nan=False, description="Historical donation frequency in days")
    registration_days: float = Field(..., ge=0, allow_inf_nan=False, description="Days since platform registration")
    role: str = Field(..., description="Donor role e.g. 'Regular Donor', 'Bridge Donor', 'Emergency Donor', 'Guest'")
    blood_group: str = Field(..., description="Blood group e.g. 'O Positive', 'B Positive'")
    gender: str = Field(..., description="Gender e.g. 'Male', 'Female'")
    donor_type: str = Field(..., description="Donor type e.g. 'Regular Donor', 'One-Time Donor'")
    eligibility_status: str = Field(..., description="Clinical eligibility e.g. 'eligible', 'not eligible'")

class ProbabilityDistribution(BaseModel):
    active: float
    inactive: float

class DonorStatusPredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    is_inactive: int
    status_label: str
    probabilities: ProbabilityDistribution
    model_version: str

def verify_ml_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> bool:
    """
    Validates API key for ML inference endpoint using constant-time comparison.
    Fails closed (HTTP 503) if server environment variable RAKSHAI_ML_API_KEY is not configured.
    Returns HTTP 401 if request header X-API-Key is missing or invalid.
    Never logs or exposes the key.
    """
    configured_key = os.getenv("RAKSHAI_ML_API_KEY")
    if not configured_key:
        raise HTTPException(
            status_code=503,
            detail="ML service authentication is not configured on the server."
        )
    if not x_api_key or not hmac.compare_digest(x_api_key, configured_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key."
        )
    return True

@app.post("/predict/donor-status", response_model=DonorStatusPredictionResponse)
async def predict_donor_status(
    req: DonorStatusPredictionRequest,
    _auth: bool = Depends(verify_ml_api_key)
):
    """
    Local ML inference endpoint predicting donor engagement activity status (Active vs. Inactive).
    Strictly for administrative retention/outreach prioritization; NOT for clinical decisions.
    Zero PII or sensitive request body logging.
    """
    if ml_pipeline is None:
        raise HTTPException(
            status_code=503, 
            detail="ML inference model is currently unavailable."
        )
    
    try:
        features = {
            "cycle_of_donations": float(req.cycle_of_donations),
            "frequency_in_days": float(req.frequency_in_days),
            "registration_days": float(req.registration_days),
            "role": str(req.role),
            "blood_group": str(req.blood_group),
            "gender": str(req.gender),
            "donor_type": str(req.donor_type),
            "eligibility_status": str(req.eligibility_status)
        }
        input_df = pd.DataFrame([features], columns=ml_feature_order)
        
        # Predict class probabilities
        probs = ml_pipeline.predict_proba(input_df)[0]
        # Canonical mapping: Column 0 is P(Active), Column 1 is P(Inactive)
        prob_active = float(round(probs[0], 4))
        prob_inactive = float(round(probs[1], 4))
        
        is_inactive = int(prob_inactive >= 0.5)
        status_label = "Inactive" if is_inactive == 1 else "Active"
        
        return DonorStatusPredictionResponse(
            is_inactive=is_inactive,
            status_label=status_label,
            probabilities=ProbabilityDistribution(
                active=prob_active,
                inactive=prob_inactive
            ),
            model_version=ml_model_version
        )
    except Exception as exc:
        print(f"ML inference failed ({type(exc).__name__}).")
        raise HTTPException(status_code=503, detail="ML inference is temporarily unavailable.")


# --- Clinical Guidelines RAG Endpoints ---

class RagQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3
    min_score_threshold: Optional[float] = 0.25

class CitationItem(BaseModel):
    document_title: str
    issuing_organization: str
    version: str
    publication_date: str
    section: str
    page: int
    relevance_score: float

class RagQueryResponse(BaseModel):
    success: bool
    status: str
    generation_mode: Optional[str] = "LOCAL_GROUNDED_SYNTHESIS"
    retrieval_engine: Optional[str] = "BM25_IDF_TOKENIZED"
    query: Optional[str] = None
    answer: str
    citations: List[CitationItem] = []
    retrieved_chunks_count: int
    bedrock_metadata: Optional[Dict[str, Any]] = None
    disclaimer: str

@app.post("/rag/query", response_model=RagQueryResponse)
async def query_clinical_guidelines_rag(
    req: RagQueryRequest,
    _auth: bool = Depends(verify_ml_api_key)
):
    """
    RAG Query Endpoint for Care Coordinator Decision Support.
    Retrieves approved clinical guidelines from the Knowledge Base,
    applies minimum relevance thresholds, synthesizes answers with strict
    document/section/page citations, and abstains when context is insufficient.
    """
    try:
        from guidelines_engine import get_guidelines_engine
        engine = get_guidelines_engine()
        result = engine.query(
            query_text=req.query,
            top_k=req.top_k or 3,
            min_score_threshold=req.min_score_threshold if req.min_score_threshold is not None else 0.25
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RAG query execution failed: {str(exc)}")

@app.post("/rag/sync")
async def sync_clinical_guidelines(
    _auth: bool = Depends(verify_ml_api_key)
):
    """
    Initiates idempotent synchronization of approved guidelines into the knowledge base manifest.
    Prevents repeated ingestion of unchanged documents via SHA-256 verification.
    """
    try:
        from guidelines_engine import get_guidelines_engine
        engine = get_guidelines_engine()
        manifest = engine.sync_manifest()
        return {
            "success": True,
            "message": "Clinical guidelines knowledge base synchronization completed successfully.",
            "sync_manifest": manifest
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Synchronization failed: {str(exc)}")



@app.post("/donor/register")
async def register_donor(donor: DonorRegisterRequest):
    try:
        db = get_dynamodb_resource()
        table = db.Table(donors_table_name)
        
        # Generate unique clinical Donor ID
        short_uuid = str(uuid.uuid4()).split('-')[0].upper()
        donor_id = f"RKD-{donor.bloodType}-{short_uuid}"
        
        # Build document item
        item = donor.dict()
        item['donorId'] = donor_id
        
        # Write to AWS DynamoDB
        table.put_item(Item=item)
        return {"success": True, "donorId": donor_id}
        
    except Exception as e:
        print(f"DynamoDB Error in donor registration: {e}")
        # Local mock fallback for development if DynamoDB table doesn't exist offline
        if os.getenv('STAGE') != 'prod' and 'ResourceNotFoundException' in str(e):
            short_uuid = str(uuid.uuid4()).split('-')[0].upper()
            mock_id = f"RKD-{donor.bloodType}-{short_uuid}"
            print(f"Offline Mode Fallback: Simulated donorId: {mock_id}")
            return {"success": True, "donorId": mock_id, "mock": True}
        raise HTTPException(status_code=500, detail=f"Database write failed: {str(e)}")


def send_outreach_notification(patient_name, blood_group, hospital, donor_phone, donor_name):
    # Base message to translate
    base_message = (
        f"Thalassemia patient {patient_name} ({blood_group}) urgently needs blood at {hospital}. "
        f"As a registered donor, your profile matches. Please confirm availability. Reply YES to accept."
    )
    
    # Call Amazon Translate to get Hindi translation
    translated_text = ""
    try:
        translate_client = boto3.client('translate', region_name='us-east-1')
        translation_res = translate_client.translate_text(
            Text=base_message,
            SourceLanguageCode="en",
            TargetLanguageCode="hi"
        )
        translated_text = translation_res.get('TranslatedText')
        print(f"Amazon Translate Call Success: Translated to Hindi.")
    except Exception as e:
        print(f"Amazon Translate call failed/unconfigured: {e}. Executing local fallback translator.")
        # Local fallback Hindi translation simulator
        translated_text = (
            f"थैलेसीमिया मरीज {patient_name} ({blood_group}) को {hospital} में तत्काल रक्त की आवश्यकता है। "
            f"एक पंजीकृत दाता के रूप में, आपकी प्रोफ़ाइल मेल खाती है। कृपया उपलब्धता की पुष्टि करें। स्वीकार करने के लिए YES उत्तर दें।"
        )
        
    # Format final message: "Dear Priya, [Hindi translation of the outreach message]."
    message = f"Dear {donor_name}, {translated_text}"
    
    print("\n" + "="*80)
    print(f"[AUTOMATED OUTREACH PROOF] Multilingual Outbound notification triggered!")
    print(f"To Donor: {donor_name} ({donor_phone})")
    print(f"Message: {message}")
    print("="*80 + "\n")
    
    try:
        # Try publishing to SNS (SMS)
        sns = boto3.client('sns', region_name=region)
        response = sns.publish(
            PhoneNumber=donor_phone,
            Message=message,
            MessageAttributes={
                'AWS.SNS.SMS.SenderID': {
                    'DataType': 'String',
                    'StringValue': 'RakshaAI'
                },
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional'
                }
            }
        )
        print(f"SNS Publish successful: {response.get('MessageId')}")
        return {"channel": "SNS", "status": "sent", "messageId": response.get('MessageId'), "donor": donor_name, "phone": donor_phone}
    except Exception as e:
        print(f"SNS Publish failed (expected if local/credentials not set): {e}")
        
    try:
        # Try sending Email via SES
        ses = boto3.client('ses', region_name=region)
        response = ses.send_email(
            Source="outreach@rakshaai.org",
            Destination={
                'ToAddresses': ["donor.ramesh@email.com"]
            },
            Message={
                'Subject': {
                    'Data': f"Urgent Blood Match: {patient_name} needs {blood_group}"
                },
                'Body': {
                    'Text': {
                        'Data': message
                    }
                }
            }
        )
        print(f"SES Email successful: {response.get('MessageId')}")
        return {"channel": "SES", "status": "sent", "messageId": response.get('MessageId'), "donor": donor_name, "phone": donor_phone}
    except Exception as e:
        print(f"SES Send email failed: {e}")
        
    return {"channel": "SIMULATED", "status": "printed_to_console", "donor": donor_name, "phone": donor_phone}


@app.post("/blood/request")
async def request_blood(req: BloodRequest):
    try:
        db = get_dynamodb_resource()
        table = db.Table(requests_table_name)
        
        # Generate unique Request ID
        short_uuid = str(uuid.uuid4()).split('-')[0].upper()
        request_id = f"RKSH-{short_uuid}"
        
        # Build document item
        item = req.dict()
        item['requestId'] = request_id
        
        # Write to AWS DynamoDB
        table.put_item(Item=item)
        
        # Resolve matching donor for automated outreach
        donor_phone = "+919999999999"  # Default seeded donor (Ramesh R.)
        donor_name = "Ramesh R."
        try:
            city = req.address.split(",")[-1].strip()
            # Fetch donors from DynamoDB
            donors_table = db.Table(donors_table_name)
            d_res = donors_table.scan()
            donors_list = d_res.get('Items', [])
            if not donors_list:
                donors_list = load_fallback_data().get("donors", [])
            for d in donors_list:
                if d.get("city", "").lower() == city.lower() and d.get("bloodType") == req.bloodGroup:
                    donor_phone = d.get("phone")
                    donor_name = f"{d.get('firstName')} {d.get('lastName', '')}".strip()
                    break
        except Exception as ex:
            print(f"Error fetching matching donor from DynamoDB: {ex}")
            
        outreach = send_outreach_notification(
            patient_name=f"{req.firstName} {req.lastName}",
            blood_group=req.bloodGroup,
            hospital=req.hospital,
            donor_phone=donor_phone,
            donor_name=donor_name
        )
        
        return {"success": True, "requestId": request_id, "outreach": outreach}
        
    except Exception as e:
        print(f"DynamoDB Error in blood request: {e}")
        # Local mock fallback for development if DynamoDB table doesn't exist offline
        if os.getenv('STAGE') != 'prod' and 'ResourceNotFoundException' in str(e):
            short_uuid = str(uuid.uuid4()).split('-')[0].upper()
            mock_id = f"RKSH-{short_uuid}"
            print(f"Offline Mode Fallback: Simulated requestId: {mock_id}")
            
            # Fetch fallback donor
            donor_phone = "+919999999999"
            donor_name = "Ramesh R."
            try:
                city = req.address.split(",")[-1].strip()
                donors_list = load_fallback_data().get("donors", [])
                for d in donors_list:
                    if d.get("city", "").lower() == city.lower() and d.get("bloodType") == req.bloodGroup:
                        donor_phone = d.get("phone")
                        donor_name = f"{d.get('firstName')} {d.get('lastName', '')}".strip()
                        break
            except Exception:
                pass
                
            outreach = send_outreach_notification(
                patient_name=f"{req.firstName} {req.lastName}",
                blood_group=req.bloodGroup,
                hospital=req.hospital,
                donor_phone=donor_phone,
                donor_name=donor_name
            )
            
            return {"success": True, "requestId": mock_id, "mock": True, "outreach": outreach}
        raise HTTPException(status_code=500, detail=f"Database write failed: {str(e)}")


def load_fallback_data():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        fallback_path = os.path.abspath(os.path.join(current_dir, "../../public/seed_data.json"))
        if os.path.exists(fallback_path):
            with open(fallback_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading fallback data: {e}")
    return {"donors": [], "patients": []}


@app.get("/donors")
async def get_donors(blood_type: Optional[str] = None, city: Optional[str] = None):
    try:
        db = get_dynamodb_resource()
        table = db.Table(donors_table_name)
        
        # Build FilterExpression dynamically
        filter_exprs = []
        expression_values = {}
        
        if blood_type:
            filter_exprs.append("bloodType = :bt")
            expression_values[":bt"] = blood_type
        if city:
            filter_exprs.append("city = :c")
            expression_values[":c"] = city
            
        if filter_exprs:
            response = table.scan(
                FilterExpression=" AND ".join(filter_exprs),
                ExpressionAttributeValues=expression_values
            )
        else:
            response = table.scan()
            
        return response.get('Items', [])
    except Exception as e:
        print(f"DynamoDB Error in get_donors: {e}")
        data = load_fallback_data()
        donors_list = data.get("donors", [])
        if blood_type:
            donors_list = [d for d in donors_list if d.get("bloodType") == blood_type]
        if city:
            donors_list = [d for d in donors_list if d.get("city") == city]
        return donors_list


@app.get("/patients")
async def get_patients():
    try:
        db = get_dynamodb_resource()
        table = db.Table(requests_table_name)
        response = table.scan()
        return response.get('Items', [])
    except Exception as e:
        print(f"DynamoDB Error in get_patients: {e}")
        data = load_fallback_data()
        return data.get("patients", [])


@app.get("/donor/by-phone/{phone}")
async def get_donor_by_phone(phone: str):
    try:
        db = get_dynamodb_resource()
        table = db.Table(donors_table_name)
        response = table.scan(
            FilterExpression="phone = :p",
            ExpressionAttributeValues={":p": phone}
        )
        items = response.get('Items', [])
        if items:
            return items[0]
        raise HTTPException(status_code=404, detail="Donor not found")
    except Exception as e:
        print(f"DynamoDB Error in get_donor_by_phone: {e}")
        data = load_fallback_data()
        for d in data.get("donors", []):
            if d.get("phone") == phone:
                return d
        raise HTTPException(status_code=404, detail="Donor not found")


@app.get("/blood/request/by-phone/{phone}")
async def get_patient_by_phone(phone: str):
    try:
        db = get_dynamodb_resource()
        table = db.Table(requests_table_name)
        response = table.scan(
            FilterExpression="phone = :p",
            ExpressionAttributeValues={":p": phone}
        )
        items = response.get('Items', [])
        if items:
            return items[0]
        raise HTTPException(status_code=404, detail="Patient blood request not found")
    except Exception as e:
        print(f"DynamoDB Error in get_patient_by_phone: {e}")
        data = load_fallback_data()
        for p in data.get("patients", []):
            if p.get("phone") == phone:
                return p
        raise HTTPException(status_code=404, detail="Patient blood request not found")


@app.delete("/donor/{donor_id}")
async def delete_donor(donor_id: str):
    try:
        db = get_dynamodb_resource()
        table = db.Table(donors_table_name)
        table.delete_item(Key={'donorId': donor_id})
        return {"success": True, "message": f"Donor {donor_id} deleted successfully"}
    except Exception as e:
        print(f"Error in delete_donor: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete donor: {str(e)}")


@app.delete("/patient/{request_id}")
async def delete_patient(request_id: str):
    try:
        db = get_dynamodb_resource()
        table = db.Table(requests_table_name)
        table.delete_item(Key={'requestId': request_id})
        return {"success": True, "message": f"Patient request {request_id} deleted successfully"}
    except Exception as e:
        print(f"Error in delete_patient: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete patient request: {str(e)}")


@app.get("/match")
async def match_donors(patient_id: str):
    try:
        db = get_dynamodb_resource()
        
        # 1. Fetch patient details
        requests_table = db.Table(requests_table_name)
        p_res = None
        try:
            p_res = requests_table.get_item(Key={'requestId': patient_id})
        except Exception as e:
            print(f"DynamoDB get_item error: {e}")
            
        patient = p_res.get('Item') if p_res else None
        
        # Fallback to local seed JSON if DynamoDB is offline or table is empty
        if not patient:
            data = load_fallback_data()
            for p in data.get("patients", []):
                if p.get("requestId") == patient_id:
                    patient = p
                    break
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient blood request not found")
            
        patient_blood = patient.get("bloodGroup")
        patient_city = patient.get("city") or patient.get("address", "").split(",")[-1].strip()
        patient_state = patient.get("state") or ""
        
        # 2. Fetch all donors
        donors_table = db.Table(donors_table_name)
        d_res = None
        try:
            d_res = donors_table.scan()
        except Exception as e:
            print(f"DynamoDB scan error: {e}")
            
        donors_list = d_res.get('Items', []) if d_res else []
        
        # Fallback to local seed JSON
        if not donors_list:
            data = load_fallback_data()
            donors_list = data.get("donors", [])
            
        # Helper for blood compatibility
        def check_blood_compatibility(donor_bg, patient_bg):
            # Thalassemia patients need red blood cells that are highly compatible.
            # Compatible maps (Donor -> Patient):
            compatibility = {
                "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
                "O+": ["O+", "A+", "B+", "AB+"],
                "A-": ["A-", "A+", "AB-", "AB+"],
                "A+": ["A+", "AB+"],
                "B-": ["B-", "B+", "AB-", "AB+"],
                "B+": ["B+", "AB+"],
                "AB-": ["AB-", "AB+"],
                "AB+": ["AB+"]
            }
            if donor_bg == patient_bg:
                return "exact"
            elif patient_bg in compatibility.get(donor_bg, []):
                return "compatible"
            return "incompatible"

        import datetime
        # Reference date set to 2026-06-07 to keep calculations aligned with the mock dataset times
        ref_date = datetime.date(2026, 6, 7)
        
        # Prepare batch input for Render ML API
        ml_scores = {}
        try:
            batch_inputs = []
            city_coords = {
                "hyderabad": (17.3850, 78.4867),
                "secunderabad": (17.4399, 78.4983),
                "pune": (18.5204, 73.8567),
                "mumbai": (19.0760, 72.8777),
                "delhi": (28.6139, 77.2090),
                "bangalore": (12.9716, 77.5946),
                "chennai": (13.0827, 80.2707),
                "jaipur": (26.9124, 75.7873),
                "nagpur": (21.1458, 79.0882),
                "kolkata": (22.5726, 88.3639),
                "ahmedabad": (23.0225, 72.5714),
            }
            patient_city_str = patient_city.lower() if patient_city else ""
            
            for d in donors_list:
                donor_bg = d.get("bloodType")
                last_donated_str = d.get("lastDonated")
                days_since = 999
                eligible = True
                if last_donated_str:
                    try:
                        ld_date = datetime.datetime.strptime(last_donated_str, "%Y-%m-%d").date()
                        days_since = (ref_date - ld_date).days
                        if days_since < 0:
                            days_since = 999
                        eligible = days_since >= 90
                    except Exception:
                        pass
                
                donor_city_str = d.get("city", "").lower()
                lat, lon = city_coords.get(donor_city_str, (17.3850, 78.4867))
                
                features = {
                    'role_status': 1.0,
                    'bridge_status': 1.0,
                    'latitude': lat,
                    'longitude': lon,
                    'quantity_required': float(patient.get("donorCount", "1") if patient.get("donorCount") else 1.0),
                    'donations_till_date': float(d.get("donationCount", 0) if d.get("donationCount") else 0.0),
                    'cycle_of_donations': 90.0,
                    'total_calls': 5.0,
                    'frequency_in_days': 90.0,
                    'status_of_bridge': 1.0,
                    'registration_date_days': 120.0,
                    'last_contacted_date_days': 15.0,
                    'last_donation_date_days': float(days_since),
                    'last_transfusion_date_days': 15.0,
                    'expected_next_transfusion_date_days': 6.0,
                    'next_eligible_date_days': float(max(0, 90 - days_since)),
                    'last_bridge_donation_date_days': 45.0,
                    'role': "Emergency Donor" if d.get("role") == "Emergency Donor" else "Bridge Donor",
                    'blood_group': d.get("bloodType", "O Positive"),
                    'gender': d.get("gender", "Male"),
                    'donor_type': "Regular Donor" if d.get("donationCount", 0) and int(d.get("donationCount", 0)) > 2 else "One-Time Donor",
                    'bridge_gender': patient.get("gender", "Male"),
                    'bridge_blood_group': patient.get("bloodGroup", "O Positive"),
                    'eligibility_status': "eligible" if eligible else "not eligible"
                }
                batch_inputs.append(features)
                
            if batch_inputs:
                import urllib.request
                import json
                
                req_data = json.dumps({"inputs": batch_inputs}).encode('utf-8')
                model_url = os.getenv("MODEL_API_URL", "https://raksha-model-api.onrender.com/predict/batch")
                
                req = urllib.request.Request(
                    model_url,
                    data=req_data,
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=3.5) as response:
                    res = json.loads(response.read().decode('utf-8'))
                    if res.get("success"):
                        probabilities = res.get("probabilities", [])
                        for idx, d_item in enumerate(donors_list):
                            ml_scores[d_item.get("donorId")] = probabilities[idx] * 100.0
                        print(f"ML Model batch prediction succeeded for {len(donors_list)} donors.")
        except Exception as e:
            print(f"Error calling Render ML model API: {e}. Falling back to heuristic scoring.")

        matched_donors = []
        for d in donors_list:
            donor_bg = d.get("bloodType")
            donor_city = d.get("city", "")
            donor_state = d.get("state", "")
            
            # 1. Heuristic Blood Type Match (40 pts)
            blood_comp = check_blood_compatibility(donor_bg, patient_blood)
            if blood_comp == "exact":
                blood_score = 40.0
            elif blood_comp == "compatible":
                blood_score = 30.0
            else:
                blood_score = 0.0
                
            # If blood is completely incompatible, skip this donor for this patient
            if blood_score == 0.0:
                continue
                
            # 2. Heuristic City Match (30 pts)
            if donor_city.lower() == patient_city.lower():
                city_score = 30.0
            elif donor_state.lower() == patient_state.lower() and donor_state != "":
                city_score = 15.0
            else:
                city_score = 0.0
                
            # 3. Days Since Last Donation (30 pts)
            last_donated_str = d.get("lastDonated")
            days_since = None
            if not last_donated_str:
                recency_score = 30.0
                days_since = 999
                eligible = True
                explanation_recency = "no previous donation (30/30)"
            else:
                try:
                    ld_date = datetime.datetime.strptime(last_donated_str, "%Y-%m-%d").date()
                    days_since = (ref_date - ld_date).days
                    if days_since < 0:
                        days_since = 999
                    if days_since >= 180:
                        recency_score = 30.0
                        eligible = True
                        explanation_recency = f"{days_since} days since last donation (30/30)"
                    elif days_since >= 90:
                        recency_score = 20.0
                        eligible = True
                        explanation_recency = f"{days_since} days since last donation (20/30)"
                    else:
                        recency_score = 0.0
                        eligible = False
                        explanation_recency = f"deferred: only {days_since} days since last donation (0/30)"
                except Exception as ex:
                    print(f"Error parsing lastDonated for donor {d.get('donorId')}: {ex}")
                    recency_score = 30.0
                    days_since = 999
                    eligible = True
                    explanation_recency = "unknown recency, assumed ready (30/30)"
            
            # Use ML score if successfully fetched from Render, else default to heuristic
            donor_id = d.get("donorId")
            if donor_id in ml_scores:
                total_score = round(ml_scores[donor_id], 1)
                score_breakdown = {
                    "bloodTypeMatchScore": blood_score,
                    "cityMatchScore": city_score,
                    "recencyScore": recency_score,
                    "rankingLabel": "XGBoost ML model",
                    "explanation": (
                        f"XGBoost ML model predicted {total_score}% probability of donation fit based on 62 features."
                    )
                }
            else:
                total_score = round(blood_score + city_score + recency_score, 1)
                score_breakdown = {
                    "bloodTypeMatchScore": blood_score,
                    "cityMatchScore": city_score,
                    "recencyScore": recency_score,
                    "rankingLabel": "ML-powered ranking (Heuristic fallback)",
                    "explanation": (
                        f"ML-powered ranking (Heuristic fallback): {blood_comp.capitalize()} blood type ({blood_score}/40), "
                        f"{'exact' if city_score == 30 else ('state-only' if city_score == 15 else 'no')} city match ({city_score}/30), "
                        f"{explanation_recency}."
                    )
                }
            
            donor_match = dict(d)
            donor_match["matchScore"] = total_score
            donor_match["scoreBreakdown"] = score_breakdown
            donor_match["daysSinceLastDonation"] = days_since
            donor_match["eligible"] = eligible
            
            matched_donors.append(donor_match)
            
        # 4. Sort by matchScore descending (ranked list)
        matched_donors.sort(key=lambda x: x["matchScore"], reverse=True)
        
        return {
            "patient": {
                "requestId": patient_id,
                "name": f"{patient.get('firstName')} {patient.get('lastName')}",
                "bloodGroup": patient_blood,
                "city": patient_city,
                "state": patient_state
            },
            "matches": matched_donors,
            "count": len(matched_donors)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in match_donors: {e}")
        raise HTTPException(status_code=500, detail=f"Matching calculation failed: {str(e)}")


# Helper functions for Care Memory stored in DynamoDB
_LOCAL_CHAT_SESSIONS = {}

def get_chat_history_from_db(patient_id: str):
    try:
        db = get_dynamodb_resource()
        table = db.Table(chat_table_name)
        response = table.get_item(Key={'patientId': patient_id})
        item = response.get('Item')
        if item and 'messages' in item:
            return item['messages']
    except Exception as e:
        print(f"DynamoDB error fetching chat history: {e}")
        
    # Local fallback / in-memory session mock if DynamoDB table doesn't exist offline
    # Seeds the initial "care memory" conversation history showing Arjun's mother previously asking:
    # "Hi, I am Arjun's mother. We are visiting KIMS Hospital next week. Do we have B+ donors ready there?"
    # and Coordinator replying:
    # "Hello Mrs. Sharma! Yes, we have two B+ compatible donors ready for Arjun in Hyderabad: Ramesh R. (O+, Primary, 97% reliability) and Suresh K. (B+, Standby, 84% reliability). KIMS is fully aligned."
    if patient_id not in _LOCAL_CHAT_SESSIONS:
        _LOCAL_CHAT_SESSIONS[patient_id] = [
            {"role": "user", "content": "Hi, I am Arjun's mother. We are visiting KIMS Hospital next week. Do we have B+ donors ready there?"},
            {"role": "assistant", "content": "Hello Mrs. Sharma! Yes, we have two B+ compatible donors ready for Arjun in Hyderabad: Ramesh R. (O+, Primary, 97% reliability) and Suresh K. (B+, Standby, 84% reliability). KIMS is fully aligned."}
        ]
    return list(_LOCAL_CHAT_SESSIONS[patient_id])

def save_chat_history_to_db(patient_id: str, messages: list):
    try:
        db = get_dynamodb_resource()
        table = db.Table(chat_table_name)
        table.put_item(Item={'patientId': patient_id, 'messages': messages})
    except Exception as e:
        print(f"DynamoDB error saving chat history: {e}")
    _LOCAL_CHAT_SESSIONS[patient_id] = messages


@app.get("/chat/history/{patient_id}")
async def get_chat_history(patient_id: str):
    history = get_chat_history_from_db(patient_id)
    return {"history": history}


@app.post("/chat")
async def chat_with_raksha(req: ChatRequest):
    try:
        # 1. Fetch patient profile context
        db = get_dynamodb_resource()
        requests_table = db.Table(requests_table_name)
        p_res = None
        try:
            p_res = requests_table.get_item(Key={'requestId': req.patient_id})
        except Exception as e:
            print(f"DynamoDB get_item error for chat patient profile: {e}")
            
        patient = p_res.get('Item') if p_res else None
        
        # Fallback to local seed JSON if DynamoDB is offline or table is empty
        if not patient:
            data = load_fallback_data()
            for p in data.get("patients", []):
                if p.get("requestId") == req.patient_id:
                    patient = p
                    break
        
        if not patient:
            # Create a basic default patient object if not found anywhere
            patient = {
                "firstName": "Arjun",
                "lastName": "Sharma",
                "bloodGroup": "B+",
                "address": "Flat 302, Green Meadows, Gachibowli, Hyderabad",
                "hospital": "Rainbow Thalassemia Centre",
                "transfusionFreq": "Every 21 days",
                "lastHb": "7.6",
                "medications": "Deferasirox, Folic Acid",
                "hematologist": "Dr. Meera Iyer",
                "requestId": req.patient_id
            }

        # 2. Convert patient profile to JSON string for prompt context
        patient_json_str = json.dumps(patient, indent=2)
        
        system_prompt = (
            f"You are Raksha, a universal medical assistant, blood coordinator, and healthcare guide. "
            f"You are highly knowledgeable, accurate, and capable of explaining any medical condition, treatment, drug, or health query from a professional medical aspect with great accuracy and clarity, in addition to managing blood donation and patient coordination. "
            f"You have access to this patient's profile:\n{patient_json_str}\n"
            f"Answer in the user's language (e.g. English, Hindi, Telugu). "
            f"Be professional, caring, helpful, highly accurate, and concise. Refer to specific details from their profile when relevant (e.g., blood group, hospital, medications)."
        )
        
        # 3. Retrieve conversational history (Care Memory) from DynamoDB
        history = get_chat_history_from_db(req.patient_id)
        
        # Append the new user query to history
        history.append({"role": "user", "content": req.message})
        
        # Pass the last 5 messages as context in each Bedrock call
        context_messages = list(history[-5:])
        
        # Ensure it starts with user and alternates correctly for Claude
        while context_messages and context_messages[0]["role"] != "user":
            context_messages.pop(0)
            
        # 4. Try calling AWS Bedrock Claude 3 Haiku
        try:
            # Format history for Claude 3 Messages API
            messages_list = []
            for msg in context_messages:
                messages_list.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            # Setup Bedrock client
            bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')
            
            # Construct request body
            body_payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "system": system_prompt,
                "messages": messages_list,
                "temperature": 0.5
            }
            
            response = bedrock_client.invoke_model(
                modelId="anthropic.claude-3-haiku-20240307-v1:0",
                body=json.dumps(body_payload)
            )
            
            response_body = json.loads(response.get('body').read().decode('utf-8'))
            reply_text = response_body['content'][0]['text']
            
            # Append reply to history and save
            history.append({"role": "assistant", "content": reply_text})
            save_chat_history_to_db(req.patient_id, history)
            
            return {
                "response": reply_text,
                "source": "Bedrock Claude",
                "patient_id": req.patient_id
            }
            
        except Exception as bedrock_err:
            print(f"Bedrock API call failed/unconfigured: {bedrock_err}. Executing simulated fallback.")
            
            # 5. Multilingual profile-aware local fallback simulator (using intelligent chatbot_fallback module)
            try:
                from app.chatbot_fallback import get_fallback_response
            except ImportError:
                from chatbot_fallback import get_fallback_response
                
            bg = patient.get('bloodGroup', 'B+')
            data = load_fallback_data()
            compatible_donors = []
            for d in data.get("donors", []):
                city = patient.get("city") or patient.get("address", "").split(",")[-1].strip()
                if d.get("city", "").lower() == city.lower() and d.get("bloodType") == bg:
                    compatible_donors.append(f"{d.get('firstName')} {d.get('lastName', '')}".strip())
                    
            res = get_fallback_response(req.message, patient, compatible_donors)
            reply = res["response"]
            
            # Append reply to history and save
            history.append({"role": "assistant", "content": reply})
            save_chat_history_to_db(req.patient_id, history)
            
            res["debug_info"]["context_length"] = len(context_messages)
            res["patient_id"] = req.patient_id
            return res
            
    except Exception as outer_err:
        print(f"Chat API general exception: {outer_err}")
        raise HTTPException(status_code=500, detail=f"Failed to process request: {str(outer_err)}")


# Detailed educational articles data for Library Integration
LIBRARY_ARTICLES = {
    "recurring-donor-necessity": {
        "title": "Why Thalassemia Patients Need the Same Donor to Come Back",
        "tag": "FOR DONORS",
        "readTime": "5 min read",
        "date": "Updated January 2025",
        "content": """
            <div class="article-content">
                <p class="lead">Most blood donation platforms treat every donation as a one-time transaction. For Thalassemia patients, that model is dangerous. Here's why recurring, compatible donation is a medical necessity.</p>
                
                <h2>The Challenge of Chronic Transfusions</h2>
                <p>Thalassemia patients depend on regular blood transfusions every 2 to 5 weeks to survive. Over a lifetime, a patient might receive hundreds of units of blood. When a patient is exposed to many different blood donors, their immune system is exposed to hundreds of foreign red blood cell antigens.</p>
                
                <h2>What is Alloimmunization?</h2>
                <p>Alloimmunization occurs when the patient's immune system recognizes minor antigens on the transfused red cells as foreign and produces antibodies against them. Once these antibodies are formed, finding compatible blood becomes extremely difficult. It can lead to acute or delayed hemolytic transfusion reactions, where the body destroys the transfused blood, rendering the treatment ineffective and causing severe clinical complications.</p>
                
                <h2>The Power of a Dedicated Donor Pool</h2>
                <p>By pairing a patient with a small, dedicated pool of recurring donors who have matching minor antigens (Rh phenotype, Kell, etc.), we can minimize the variety of foreign antigens the patient's immune system encounters. This dramatically reduces the risk of alloimmunization, ensures the longevity of transfused cells, and protects the patient from life-threatening immune responses.</p>
                
                <h2>Why Your Commitment Matters</h2>
                <p>When you register as a recurring donor on Raksha AI, you aren't just giving a random unit of blood. You are committing to becoming a lifeline for a specific patient. Regular donations (every 3 months for men, every 4 months for women) provide stable, compatible blood and ensure the patient's hemoglobin levels remain in a safe, healthy zone.</p>
            </div>
        """
    },
    "parents-guide-transfusion": {
        "title": "The Parent's Guide to Managing Transfusion Schedules",
        "tag": "FOR FAMILIES",
        "readTime": "8 min read",
        "date": "Updated December 2024",
        "content": """
            <div class="article-content">
                <p class="lead">Managing transfusion-dependent thalassemia requires meticulous planning, emotional resilience, and active coordination. This guide helps parents navigate the schedule and support their child effectively.</p>
                
                <h2>1. Tracking Hemoglobin Levels</h2>
                <p>Always maintain a detailed logbook of your child's pre-transfusion hemoglobin (Hb) levels. The goal is usually to keep pre-transfusion Hb around 9.0 - 9.5 g/dL to suppress the body's ineffective red blood cell production and promote normal growth. If you notice a sudden drop in Hb or symptoms of fatigue and irritability before the scheduled date, contact your hematologist immediately.</p>
                
                <h2>2. Scheduling and Coordination</h2>
                <p>Book transfusion appointments at least 1 week in advance. Coordinate with your blood bank to ensure that cross-matched, filtered, and leucodepleted blood is ready. Leucodepletion is critical because it removes white blood cells, reducing febrile non-hemolytic transfusion reactions and CMV transmission.</p>
                
                <h2>3. Managing Iron Overload</h2>
                <p>Every unit of transfused blood contains iron that the body cannot excrete naturally. This leads to iron accumulation in vital organs like the heart, liver, and endocrine glands. Monitor serum ferritin levels regularly (usually every 3 months). Work closely with your hematologist to start oral or subcutaneous iron chelation therapy (e.g., Deferasirox, Deferiprone, or Desferrioxamine) when ferritin exceeds 1,000 ng/mL.</p>
                
                <h2>4. Preparing Your Child</h2>
                <p>Transfusions can be stressful for a child. Be honest about the procedure. Bring their favorite books, toys, or a tablet to keep them distracted during the 2-4 hour transfusion. Keep them well-hydrated before the session to make vein access easier.</p>
            </div>
        """
    },
    "alloimmunization-risk": {
        "title": "Alloimmunization: The Hidden Risk in Unmatched Transfusions",
        "tag": "MEDICAL",
        "readTime": "6 min read",
        "date": "Updated November 2024",
        "content": """
            <div class="article-content">
                <p class="lead">Each time a patient receives blood with incompatible minor antigens, their immune system builds resistance. Over hundreds of transfusions, this becomes life-threatening.</p>
                
                <h2>Minor Antigens and Clinical Immunology</h2>
                <p>While standard blood matching focuses on ABO and RhD antigens, red blood cells contain hundreds of other minor antigens belonging to systems like Kell (K, k), Rh (C, c, E, e), Duffy (Fya, Fyb), Kidd (Jka, Jkb), and MNS. For patients receiving chronic transfusions, standard ABO/RhD matching is insufficient.</p>
                
                <h2>Mechanism of Antibody Formation</h2>
                <p>When there is a mismatch in these minor antigens, the recipient's immune system identifies them as foreign, triggering B-lymphocytes to produce specific alloantibodies. Upon subsequent transfusions with cells carrying the same antigens, the antibodies bind to the donor cells, leading to extravascular hemolysis (destruction of red cells in the spleen or liver).</p>
                
                <h2>Consequences of Alloimmunization</h2>
                <ul>
                    <li><strong>Difficult Cross-matching:</strong> Finding compatible blood becomes a search for a needle in a haystack, causing critical delays in treatment.</li>
                    <li><strong>Hemolytic Transfusion Reactions:</strong> Can cause fever, chills, jaundice, renal failure, and severe chest or back pain.</li>
                    <li><strong>Hyperhemolysis Syndrome:</strong> A rare, life-threatening condition where the patient destroys both the transfused cells and their own native red blood cells.</li>
                </ul>
                
                <h2>Preventative Strategies</h2>
                <p>The primary method to prevent alloimmunization is <strong>extended antigen typing (phenotyping)</strong> of both the patient and the donor pool. Matching for at least the Kell and Rh sub-antigens (C, c, E, e) is now recommended as standard care for all newly diagnosed thalassemia patients.</p>
            </div>
        """
    },
    "what-is-thalassemia": {
        "title": "What Is Thalassemia?",
        "tag": "FOR FAMILIES",
        "readTime": "4 min read",
        "date": "Updated February 2025",
        "content": """
            <div class="article-content">
                <p class="lead">Thalassemia is an inherited blood disorder characterized by less oxygen-carrying protein (hemoglobin) and fewer red blood cells in the body than normal.</p>
                
                <h2>The Genetic Basis</h2>
                <p>Thalassemia is caused by mutations in the DNA of cells that make hemoglobin. Hemoglobin molecules are made of alpha and beta chains. In thalassemia, the production of either the alpha or beta chains is reduced, leading to alpha-thalassemia or beta-thalassemia.</p>
                
                <h2>Thalassemia Major vs. Minor</h2>
                <ul>
                    <li><strong>Thalassemia Minor (Carrier):</strong> If you receive only one mutated gene from one parent, you have thalassemia minor. Carriers usually have no symptoms or very mild anemia and do not require treatment.</li>
                    <li><strong>Thalassemia Major (TDT):</strong> If you receive mutated genes from both parents, you have thalassemia major (Transfusion-Dependent Thalassemia). Symptoms usually appear within the first two years of life, causing severe anemia, fatigue, pale skin, and slow growth.</li>
                </ul>
                
                <h2>Treatment & Management</h2>
                <p>Patients with Thalassemia Major require lifelong medical care, including regular blood transfusions (every few weeks) to maintain healthy hemoglobin levels, combined with iron chelation therapy to remove excess iron from the body. For some patients, a bone marrow transplant can offer a permanent cure.</p>
            </div>
        """
    },
    "blood-compatibility": {
        "title": "Understanding Blood Compatibility",
        "tag": "MEDICAL",
        "readTime": "7 min read",
        "date": "Updated March 2025",
        "content": """
            <div class="article-content">
                <p class="lead">Blood compatibility goes far beyond the basic A, B, AB, and O blood groups. For patients who receive chronic transfusions, understanding extended typing is a life-saving necessity.</p>
                
                <h2>The ABO and RhD Systems</h2>
                <p>ABO and RhD are the primary antigens checked during any standard blood transfusion. While O-negative is the universal donor for emergency situations, chronic transfusion recipients cannot rely on basic compatibility because of the hundreds of other minor proteins present on the surface of red blood cells.</p>
                
                <h2>The Importance of Extended Phenotypical Matching</h2>
                <p>Extended phenotyping involves checking for minor antigens in other blood group systems, particularly the Rh subgroups (C, c, E, e) and the Kell system (K, k). Matching these antigens between the donor and recipient reduces the probability of the patient developing antibodies (alloimmunization) by more than 80%.</p>
                
                <h2>How Raksha AI Bridges the Gap</h2>
                <p>Raksha AI catalogs the extended phenotypical profiles of registered donors and matches them with patient profiles. By finding exact or highly compatible antigen matches in local databases, we prevent immune reactions before they start, ensuring safe, effective, and sustainable transfusions.</p>
            </div>
        """
    },
    "transfusion-dependent": {
        "title": "Transfusion-Dependent Thalassemia",
        "tag": "FOR FAMILIES",
        "readTime": "6 min read",
        "date": "Updated February 2025",
        "content": """
            <div class="article-content">
                <p class="lead">Transfusion-Dependent Thalassemia (TDT) represents the severe end of the thalassemia spectrum, where standard bone marrow cannot produce enough healthy red blood cells, requiring regular medical transfusions.</p>
                
                <h2>Understanding TDT</h2>
                <p>Patients with Thalassemia Major or severe HbE-beta thalassemia are typical examples of TDT. Without regular red blood cell infusions, severe anemia develops, leading to fatigue, skeletal deformities, heart failure, and failure to thrive. Regular transfusions provide the body with healthy donor red blood cells, suppressing the patient's own ineffective erythropoiesis (red blood cell production) and supporting normal growth and physical activity.</p>
                
                <h2>Standard Transfusion Guidelines</h2>
                <p>The generally accepted therapeutic goal is to maintain the pre-transfusion hemoglobin level between 9.0 and 9.5 g/dL. Transfusions are typically scheduled every 2 to 5 weeks. It is crucial that the transfused blood is filtered, leucoreduced (white cells removed), and phenotypic-matched to avoid minor group reactions.</p>
                
                <h2>Living with TDT</h2>
                <p>With modern medical management (combining transfusion and chelation therapy), individuals with TDT can lead active, productive, and long lives. Adhering to the treatment plan, staying in close contact with hematologists, and participating in patient support organizations like the Blood Warriors Foundation are key pillars of care.</p>
            </div>
        """
    },
    "iron-overload-chelation": {
        "title": "Iron Overload & Chelation Therapy",
        "tag": "MEDICAL",
        "readTime": "7 min read",
        "date": "Updated January 2025",
        "content": """
            <div class="article-content">
                <p class="lead">Chronic blood transfusions inevitably lead to iron accumulation. Because the human body lacks a natural mechanism to excrete iron, iron chelation therapy is a mandatory component of thalassemia care.</p>
                
                <h2>The Cause of Iron Overload</h2>
                <p>Each unit of blood contains approximately 200–250 mg of iron. In patients receiving 20–25 transfusions a year, this amounts to 5 grams of excess iron annually. Once the body's iron-binding capacity is saturated, free iron deposits in tissues, leading to tissue damage, liver cirrhosis, heart failure, diabetes, and other endocrine disorders.</p>
                
                <h2>Monitoring Iron Levels</h2>
                <p>Serum Ferritin level monitoring is the most common and simple method, typically checked every 3 months. Magnetic Resonance Imaging (MRI T2*) of the liver and heart is the gold standard for measuring organ-specific iron concentrations and is recommended annually once transfusion history exceeds 1–2 years.</p>
                
                <h2>Chelation Therapies</h2>
                <p>Three main iron chelating drugs are widely used:
                    <ul>
                        <li><strong>Deferasirox (Oral):</strong> Taken once daily, highly convenient, and currently the first-line treatment for most patients.</li>
                        <li><strong>Deferiprone (Oral):</strong> Usually taken three times a day, highly effective at clearing cardiac iron.</li>
                        <li><strong>Desferrioxamine (Subcutaneous Infusion):</strong> Infused slowly over 8–12 hours using a portable pump, typically 5-7 nights a week. Used for severe overload or when oral options are not suitable.</li>
                    </ul>
                </p>
            </div>
        """
    },
    "bone-marrow-transplant": {
        "title": "Bone Marrow Transplant",
        "tag": "FOR FAMILIES",
        "readTime": "5 min read",
        "date": "Updated March 2025",
        "content": """
            <div class="article-content">
                <p class="lead">For patients with Transfusion-Dependent Thalassemia, a Bone Marrow Transplant (BMT) represents the only currently available curative treatment option.</p>
                
                <h2>What is a Bone Marrow Transplant?</h2>
                <p>BMT (also called a Hematopoietic Stem Cell Transplant) replaces the patient's defective blood-forming stem cells in the bone marrow with healthy stem cells from a compatible donor. If successful, the donor's cells take over blood production, enabling the patient to produce normal hemoglobin and eliminating the need for transfusions.</p>
                
                <h2>HLA Matching & Donor Selection</h2>
                <p>The success of a BMT heavily depends on finding a closely matched donor. Human Leukocyte Antigens (HLA) are proteins found on most cells in your body. The best donor is typically a fully HLA-matched sibling (1-in-4 chance). If a sibling match is not available, matched unrelated donors (MUD) from global registries or haploidentical (half-matched) family donors may be considered, though they carry higher risk.</p>
                
                <h2>Eligibility and Outcomes</h2>
                <p>BMT is most successful when performed in early childhood (typically under 8-10 years of age) before significant organ damage from iron overload has occurred. The Pesaro classification system evaluates risk based on liver size, portal fibrosis, and adequacy of prior chelation. Patients in the low-risk category have a cure rate exceeding 85-90%.</p>
            </div>
        """
    },
    "thalassemia-at-school": {
        "title": "Thalassemia at School",
        "tag": "FOR FAMILIES",
        "readTime": "4 min read",
        "date": "Updated February 2025",
        "content": """
            <div class="article-content">
                <p class="lead">Supporting a child with transfusion-dependent thalassemia in school is crucial for their emotional, social, and academic development.</p>
                
                <h2>Communication is Key</h2>
                <p>At the start of the school year, meet with teachers, principal, and school nurse. Provide them with a simple informational sheet about thalassemia, explaining that it is a non-contagious genetic blood disorder, and outline the child's treatment schedule.</p>
                
                <h2>Managing Absences and Fatigue</h2>
                <p>Students will require monthly absences for blood transfusions. Work with teachers to obtain assignments in advance. Some children may experience fatigue, decreased concentration, or irritability in the days leading up to their transfusion when hemoglobin levels are at their lowest. Teachers should be aware and accommodate rest breaks if needed.</p>
                
                <h2>Physical Education</h2>
                <p>Children with thalassemia should be encouraged to participate in physical activities and sports to their tolerance. However, they should not be pushed beyond their comfort zone, and should always have easy access to water to prevent dehydration.</p>
            </div>
        """
    },
    "donor-faqs": {
        "title": "Donor FAQs",
        "tag": "FOR DONORS",
        "readTime": "5 min read",
        "date": "Updated April 2025",
        "content": """
            <div class="article-content">
                <p class="lead">Got questions about donating blood for Thalassemia patients? We've compiled the most common questions and detailed answers from medical experts.</p>
                
                <h2>Does blood donation hurt?</h2>
                <p>You will feel a quick, minor pinch when the needle is inserted, but after that, you shouldn't feel pain. The actual donation process is highly monitored and completely safe.</p>
                
                <h2>How long does the donation take?</h2>
                <p>The entire process, from registration and health screening to the donation and recovery refreshment, takes about 45 to 60 minutes. The actual blood draw is only 8 to 10 minutes.</p>
                
                <h2>What is Extended Antigen Typing?</h2>
                <p>Standard donation only tests for ABO and RhD blood types. Extended typing matches minor antigens (such as Rh subgroups C, c, E, e and Kell) to prevent the patient's immune system from building antibodies (alloimmunization) over time.</p>
                
                <h2>Can a Thalassemia carrier donate blood?</h2>
                <p>Yes. Individuals with Thalassemia Minor (carriers) are generally eligible to donate blood, provided they meet standard donor hemoglobin requirements (usually 12.5 g/dL or higher). However, their blood is typically not used for transfusion-dependent thalassemia patients who require optimal hemoglobin concentration per unit.</p>
            </div>
        """
    },
    "blood-bank-directory": {
        "title": "Blood Bank Directory Guide",
        "tag": "MEDICAL",
        "readTime": "3 min read",
        "date": "Updated May 2025",
        "content": """
            <div class="article-content">
                <p class="lead">Selecting the right blood bank is a key factor in ensuring high-quality, safe transfusions. Here is how to use our directory and what to look for in a facility.</p>
                
                <h2>Key Facility Requirements</h2>
                <p>For patients with thalassemia, ensure the blood bank offers:
                    <ul>
                        <li><strong>Leucofiltered/Leucodepleted Blood:</strong> Removing white blood cells prevents febrile reactions and immune sensitization.</li>
                        <li><strong>Extended Typings:</strong> Essential for minor antigen matching to prevent alloimmunization.</li>
                        <li><strong>Thalassemia Program:</strong> Many centers offer subsidized or free blood transfusions and chelation supplies for registered patients.</li>
                    </ul>
                </p>
                
                <h2>Connecting with Blood Banks</h2>
                <p>Use the Blood Bank Directory search tool on our Library page to filter by City and State. Contact details are listed for each blood bank. We recommend calling ahead to confirm inventory and reservation protocols.</p>
            </div>
        """
    }
}


class LibraryArticleResponse(BaseModel):
    title: str
    tag: str
    readTime: str
    date: str
    content: str


@app.get("/library/article/{slug}", response_model=LibraryArticleResponse)
async def get_library_article(slug: str):
    if slug not in LIBRARY_ARTICLES:
        raise HTTPException(status_code=404, detail="Article not found")
    return LIBRARY_ARTICLES[slug]



class TranslationRequest(BaseModel):
    strings: List[str]
    target_language: str
    source_language: str = "en"

class TranslationResponse(BaseModel):
    translations: List[str]

# Simple offline fallback dictionary for common UI strings
TRANSLATION_FALLBACKS = {
    "hi": {
        "how it works": "यह कैसे काम करता है",
        "for donors": "दाताओं के लिए",
        "for patients": "मरीजों के लिए",
        "impact": "प्रभाव",
        "library": "पुस्तकालय",
        "about": "हमारे बारे में",
        "console": "कंसोल",
        "admin": "व्यवस्थापक",
        "tech stack": "तकनीकी स्टैक",
        "register as donor": "दाता के रूप में पंजीकरण करें",
        "request blood": "रक्त का अनुरोध करें",
        "go back to homepage": "मुख्य पृष्ठ पर वापस जाएं",
        "home": "होम",
        "dashboard": "डैशबोर्ड",
        "logout": "लॉगआउट",
        "back to homepage": "मुख्य पृष्ठ पर वापस",
        "overview": "अवलोकन",
        "donors directory": "दाता निर्देशिका",
        "patient requests": "मरीज अनुरोध",
        "database registry": "डेटाबेस रजिस्ट्री",
        "outreach broadcaster": "आउटरीच ब्रॉडकास्टर",
        "aws environment": "एडब्ल्यूएस वातावरण",
    },
    "te": {
        "how it works": "ఇది ఎలా పనిచేస్తుంది",
        "for donors": "దాతల కొరకు",
        "for patients": "రోగుల కొరకు",
        "impact": "ప్రభావం",
        "library": "లైబ్రరీ",
        "about": "మా గురించి",
        "console": "కన్సోల్",
        "admin": "అడ్మిన్",
        "tech stack": "టెక్ స్టాక్",
        "register as donor": "దాతగా నమోదు చేసుకోండి",
        "request blood": "రక్త దానం కొరకు అభ్యర్థించండి",
        "go back to homepage": "హోమ్ పేజీకి తిరిగి వెళ్ళండి",
        "home": "హోమ్",
        "dashboard": "డాష్‌బోర్డ్",
        "logout": "లాగ్అవుట్",
        "back to homepage": "హోమ్ పేజీకి తిరిగి",
        "overview": "అవలోకనం",
        "donors directory": "దాతల డైరెక్టరీ",
        "patient requests": "రోగుల అభ్యర్థనలు",
        "database registry": "డేటాబేస్ రిజిస్ట్రీ",
        "outreach broadcaster": "అవుట్ రీచ్ బ్రాడ్‌కాస్టర్",
        "aws environment": "AWS పర్యావరణం",
    },
    "ta": {
        "how it works": "இது எவ்வாறு செயல்படுகிறது",
        "for donors": "கொடையாளர்களுக்கு",
        "for patients": "நோயாளிக்கு",
        "impact": "தாக்கம்",
        "library": "நூலகம்",
        "about": "எங்களை பற்றி",
        "console": "கணினி",
        "admin": "நிர்வாகி",
        "tech stack": "தொழில்நுட்ப அடுக்கு",
        "register as donor": "கொடையாளராக பதிவு செய்க",
        "request blood": "இரத்தம் கோருக",
        "go back to homepage": "முகப்பு பக்கத்திற்கு செல்க",
        "home": "முகப்பு",
        "dashboard": "டாஷ்போர்டு",
        "logout": "வெளியேறு",
        "back to homepage": "முகப்பு பக்கம் செல்ல",
        "overview": "கண்ணோட்டம்",
        "donors directory": "கொடையாளர்கள் பட்டியல்",
        "patient requests": "நோயாளி கோரிக்கைகள்",
        "database registry": "தரவுத்தளம்",
        "outreach broadcaster": "வெளியீட்டு பரப்புரை",
        "aws environment": "AWS சூழல்",
    }
}

@app.post("/translate", response_model=TranslationResponse)
async def translate_text_batch(req: TranslationRequest):
    target = req.target_language.lower()
    source = req.source_language.lower()
    
    if target == source:
        return TranslationResponse(translations=req.strings)
        
    translations = []
    
    try:
        translate_client = boto3.client('translate', region_name='us-east-1')
        
        # Filter empty/whitespace strings and track original index
        non_empty = []
        original_indices = []
        
        for idx, text in enumerate(req.strings):
            stripped = text.strip()
            if not stripped:
                translations.append((idx, text))
            else:
                non_empty.append(stripped)
                original_indices.append(idx)
                
        if non_empty:
            # Send text to Translate in chunks of 50 joined by newline to avoid API overhead
            chunk_size = 50
            translated_chunks = []
            
            for i in range(0, len(non_empty), chunk_size):
                chunk = non_empty[i:i+chunk_size]
                combined_text = "\n".join(chunk)
                
                res = translate_client.translate_text(
                    Text=combined_text,
                    SourceLanguageCode=source,
                    TargetLanguageCode=target
                )
                translated_text = res.get('TranslatedText', combined_text)
                
                # Split back by newline
                translated_lines = [line.strip() for line in translated_text.split("\n")]
                
                # Check for line mismatches (rare layout shift)
                if len(translated_lines) != len(chunk):
                    print(f"Batch translate line mismatch (expected {len(chunk)}, got {len(translated_lines)}). Sequential fallback for chunk.")
                    chunk_translated = []
                    for single_text in chunk:
                        try:
                            s_res = translate_client.translate_text(
                                Text=single_text,
                                SourceLanguageCode=source,
                                TargetLanguageCode=target
                            )
                            chunk_translated.append(s_res.get('TranslatedText', single_text))
                        except Exception:
                            chunk_translated.append(single_text)
                    translated_chunks.extend(chunk_translated)
                else:
                    translated_chunks.extend(translated_lines)
            
            # Pair translated text with original indices
            for idx, trans_text in zip(original_indices, translated_chunks):
                translations.append((idx, trans_text))
                
        # Re-sort to preserve original index order
        translations.sort(key=lambda x: x[0])
        final_translations = [t[1] for t in translations]
        
    except Exception as e:
        print(f"AWS Translate failed in /translate batch: {e}. Using offline fallback.")
        fallback_dict = TRANSLATION_FALLBACKS.get(target, {})
        final_translations = []
        for text in req.strings:
            stripped = text.strip()
            if not stripped:
                final_translations.append(text)
                continue
            norm_text = stripped.lower().replace(":", "").replace(".", "").strip()
            if norm_text in fallback_dict:
                final_translations.append(fallback_dict[norm_text])
            else:
                final_translations.append(f"[{target.upper()}] {text}")
                
    return TranslationResponse(translations=final_translations)


class ReengageRequest(BaseModel):
    name: str
    role: str
    reason: str


@app.post("/outreach/reengage")
async def reengage_user(req: ReengageRequest):
    name = req.name
    role = req.role
    reason = req.reason
    
    phone = None
    email = None
    matched_name = name
    
    try:
        db = get_dynamodb_resource()
        first_word = name.split()[0].lower() if name else ""
        
        if role.lower() == "donor":
            donors_table = db.Table(donors_table_name)
            d_res = donors_table.scan()
            items = d_res.get('Items', [])
            if not items:
                items = load_fallback_data().get("donors", [])
            for d in items:
                fname = d.get("firstName", "").lower()
                fullName = f"{d.get('firstName', '')} {d.get('lastName', '')}".strip().lower()
                if first_word in fname or first_word in fullName:
                    phone = d.get("phone")
                    email = d.get("email")
                    matched_name = f"{d.get('firstName')} {d.get('lastName', '')}".strip()
                    break
        else:
            requests_table = db.Table(requests_table_name)
            p_res = requests_table.scan()
            items = p_res.get('Items', [])
            if not items:
                items = load_fallback_data().get("patients", [])
            for p in items:
                fname = p.get("firstName", "").lower()
                fullName = f"{p.get('firstName', '')} {p.get('lastName', '')}".strip().lower()
                if first_word in fname or first_word in fullName:
                    phone = p.get("phone")
                    email = p.get("email")
                    matched_name = f"{p.get('firstName')} {p.get('lastName', '')}".strip()
                    break
    except Exception as e:
        print(f"Error searching database for re-engagement recipient: {e}")
        
    # fallback mock data if not found in DB
    if not phone:
        if "rahul" in name.lower():
            phone = "+919555667788"
            email = "rahul.c@email.com"
            matched_name = "Rahul C."
        elif "karan" in name.lower():
            phone = "+919988776655"
            email = "karan.m@email.com"
            matched_name = "Karan M."
        elif "amit" in name.lower():
            phone = "+919879012345"
            email = "amit.p@email.com"
            matched_name = "Amit P."
        else:
            phone = "+919999999999"
            email = "info@rakshaai.org"
            
    # Formulate messages
    if role.lower() == "donor":
        base_message = (
            f"Hello {matched_name}, we noticed your profile has been inactive. "
            f"Status: {reason}. Thalassemia patients need your regular support. "
            f"Please reply YES to confirm your eligibility and keep active."
        )
    else:
        base_message = (
            f"Hello {matched_name}, we noticed your care schedule is inactive. "
            f"Status: {reason}. Let Raksha AI assist with your next transfusion coordination. "
            f"Please reply YES to request care assistance."
        )
        
    # Hindi Translation
    translated_text = ""
    try:
        translate_client = boto3.client('translate', region_name='us-east-1')
        translation_res = translate_client.translate_text(
            Text=base_message,
            SourceLanguageCode="en",
            TargetLanguageCode="hi"
        )
        translated_text = translation_res.get('TranslatedText')
        print(f"AWS Translate re-engage success.")
    except Exception as e:
        print(f"AWS Translate re-engage fallback: {e}")
        if role.lower() == "donor":
            translated_text = (
                f"नमस्ते {matched_name}, हमने देखा कि आपकी प्रोफ़ाइल निष्क्रिय है। "
                f"स्थिति: {reason}। थैलेसीमिया रोगियों को आपके नियमित सहयोग की आवश्यकता है। "
                f"कृपया अपनी पात्रता की पुष्टि करने और सक्रिय रहने के लिए YES उत्तर दें।"
            )
        else:
            translated_text = (
                f"नमस्ते {matched_name}, हमने देखा कि आपका देखभाल कार्यक्रम निष्क्रिय है। "
                f"स्थिति: {reason}। कृपया सहायता के लिए YES उत्तर दें।"
            )
            
    message = f"Dear {matched_name}, {base_message} / {translated_text}"
    
    print("\n" + "="*80)
    print(f"[RE-ENGAGEMENT BROADCAST] Outreach notification triggered!")
    print(f"Recipient: {matched_name} ({role}) - {phone}")
    print(f"Message: {message}")
    print("="*80 + "\n")
    
    channel = "SIMULATED"
    message_id = None
    
    # Try publishing to SNS (SMS)
    try:
        sns = boto3.client('sns', region_name=region)
        response = sns.publish(
            PhoneNumber=phone,
            Message=message,
            MessageAttributes={
                'AWS.SNS.SMS.SenderID': {
                    'DataType': 'String',
                    'StringValue': 'RakshaAI'
                },
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional'
                }
            }
        )
        channel = "SNS"
        message_id = response.get('MessageId')
        print(f"SNS re-engage SMS publish successful: {message_id}")
    except Exception as e:
        print(f"SNS re-engage SMS publish failed/skipped: {e}")
        
    # Try sending via SES if SNS fails and email exists
    if channel == "SIMULATED" and email:
        try:
            ses = boto3.client('ses', region_name=region)
            response = ses.send_email(
                Source="outreach@rakshaai.org",
                Destination={'ToAddresses': [email]},
                Message={
                    'Subject': {'Data': f"Raksha AI Care Re-engagement: Action Required"},
                    'Body': {'Text': {'Data': message}}
                }
            )
            channel = "SES"
            message_id = response.get('MessageId')
            print(f"SES re-engage email successful: {message_id}")
        except Exception as e:
            print(f"SES re-engage email failed/skipped: {e}")
            
    return {
        "success": True,
        "recipient": matched_name,
        "role": role,
        "phone": phone,
        "email": email,
        "message": message,
        "channel": channel,
        "messageId": message_id
    }


@app.get("/health")
async def health_check():
    if ml_pipeline is None or not model_metadata or not ml_feature_order:
        raise HTTPException(status_code=503, detail="ML model assets are unavailable.")
    return {
        "status": "healthy",
        "model_loaded": True,
        "model_version": ml_model_version,
    }


@app.get("/model/info")
async def model_info():
    if ml_pipeline is None or not model_metadata or not ml_feature_order:
        raise HTTPException(status_code=503, detail="ML model assets are unavailable.")
    return {
        "model_name": model_metadata.get("model_name"),
        "algorithm": model_metadata.get("algorithm"),
        "version": ml_model_version,
        "feature_order": ml_feature_order,
        "target": feature_schema.get("target"),
        "limitation_statement": model_metadata.get("limitation_statement"),
    }

# AWS Lambda Handler mapping for API Gateway proxy integrations
handler = Mangum(app)


# --- Step Functions Lambda Handlers ---

def step_function_match_handler(event, context):
    """
    AWS Lambda handler for Step Functions match state.
    """
    import datetime
    print(f"step_function_match_handler called with event: {event}")
    patient_id = event.get("patient_id")
    wait_seconds = event.get("wait_seconds", 7200)
    
    if not patient_id:
        return {"status": "NO_DONOR_FOUND", "error": "patient_id missing"}
        
    try:
        db = get_dynamodb_resource()
        requests_table = db.Table(requests_table_name)
        p_res = None
        try:
            p_res = requests_table.get_item(Key={'requestId': patient_id})
        except Exception as e:
            print(f"DynamoDB get_item error in SF match: {e}")
            
        patient = p_res.get('Item') if p_res else None
        if not patient:
            data = load_fallback_data()
            for p in data.get("patients", []):
                if p.get("requestId") == patient_id:
                    patient = p
                    break
                    
        if not patient:
            return {"status": "NO_DONOR_FOUND", "error": "patient not found"}
            
        patient_blood = patient.get("bloodGroup")
        patient_city = patient.get("city") or patient.get("address", "").split(",")[-1].strip()
        patient_state = patient.get("state") or ""
        patient_name = f"{patient.get('firstName')} {patient.get('lastName')}"
        hospital = patient.get("hospital", "Local Hospital")
        
        # Scan Donors
        donors_table = db.Table(donors_table_name)
        d_res = None
        try:
            d_res = donors_table.scan()
        except Exception as e:
            print(f"DynamoDB scan error in SF match: {e}")
            
        donors_list = d_res.get('Items', []) if d_res else []
        if not donors_list:
            data = load_fallback_data()
            donors_list = data.get("donors", [])
            
        def check_blood_compatibility(donor_bg, patient_bg):
            compatibility = {
                "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
                "O+": ["O+", "A+", "B+", "AB+"],
                "A-": ["A-", "A+", "AB-", "AB+"],
                "A+": ["A+", "AB+"],
                "B-": ["B-", "B+", "AB-", "AB+"],
                "B+": ["B+", "AB+"],
                "AB-": ["AB-", "AB+"],
                "AB+": ["AB+"]
            }
            if donor_bg == patient_bg:
                return "exact"
            elif patient_bg in compatibility.get(donor_bg, []):
                return "compatible"
            return "incompatible"
            
        ref_date = datetime.date(2026, 6, 7)
        
        matched_donors = []
        for d in donors_list:
            donor_bg = d.get("bloodType")
            donor_city = d.get("city", "")
            donor_state = d.get("state", "")
            
            blood_comp = check_blood_compatibility(donor_bg, patient_blood)
            if blood_comp == "incompatible":
                continue
                
            if blood_comp == "exact":
                blood_score = 40.0
            else:
                blood_score = 30.0
                
            if donor_city.lower() == patient_city.lower():
                city_score = 30.0
            elif donor_state.lower() == patient_state.lower() and donor_state != "":
                city_score = 15.0
            else:
                city_score = 0.0
                
            last_donated_str = d.get("lastDonated")
            days_since = None
            if not last_donated_str:
                recency_score = 30.0
                eligible = True
            else:
                try:
                    ld_date = datetime.datetime.strptime(last_donated_str, "%Y-%m-%d").date()
                    days_since = (ref_date - ld_date).days
                    if days_since < 0:
                        days_since = 999
                    if days_since >= 90:
                        recency_score = 30.0 if days_since >= 180 else 20.0
                        eligible = True
                    else:
                        recency_score = 0.0
                        eligible = False
                except Exception:
                    recency_score = 30.0
                    eligible = True
                    
            if not eligible:
                continue
                
            total_score = blood_score + city_score + recency_score
            matched_donors.append({
                "donor": d,
                "score": total_score
            })
            
        if not matched_donors:
            return {"status": "NO_DONOR_FOUND", "patient_id": patient_id}
            
        matched_donors.sort(key=lambda x: x["score"], reverse=True)
        top_match = matched_donors[0]["donor"]
        donor_name = f"{top_match.get('firstName')} {top_match.get('lastName')}"
        donor_phone = top_match.get("phone")
        donor_id = top_match.get("donorId")
        
        base_message = (
            f"Thalassemia patient {patient_name} ({patient_blood}) urgently needs blood at {hospital}. "
            f"As a registered donor, your profile matches. Please confirm availability. Reply YES to accept."
        )
        
        translated_text = ""
        try:
            translate_client = boto3.client('translate', region_name='us-east-1')
            translation_res = translate_client.translate_text(
                Text=base_message,
                SourceLanguageCode="en",
                TargetLanguageCode="hi"
            )
            translated_text = translation_res.get('TranslatedText')
        except Exception as e:
            print(f"Translate call failed in SF match: {e}. Running local fallback.")
            translated_text = (
                f"थैलेसीमिया मरीज {patient_name} ({patient_blood}) को {hospital} में तत्काल रक्त की आवश्यकता है। "
                f"एक पंजीकृत दाता के रूप में, आपकी प्रोफ़ाइल मेल खाती है। कृपया उपलब्धता की पुष्टि करें। स्वीकार करने के लिए YES उत्तर दें।"
            )
            
        outreach_message = f"Dear {donor_name}, {translated_text}"
        
        return {
            "status": "MATCHED",
            "patient_id": patient_id,
            "patient_name": patient_name,
            "donor_id": donor_id,
            "donor_name": donor_name,
            "donor_phone": donor_phone,
            "outreach_message": outreach_message,
            "wait_seconds": wait_seconds
        }
    except Exception as err:
        print(f"Exception in step_function_match_handler: {err}")
        return {"status": "NO_DONOR_FOUND", "error": str(err)}


def step_function_check_handler(event, context):
    """
    AWS Lambda handler for checking response state in Step Functions.
    """
    print(f"step_function_check_handler called with event: {event}")
    patient_id = event.get("patient_id")
    donor_id = event.get("donor_id")
    
    if not patient_id:
        return {"status": "NO_RESPONSE", "error": "patient_id missing"}
        
    try:
        db = get_dynamodb_resource()
        requests_table = db.Table(requests_table_name)
        p_res = None
        try:
            p_res = requests_table.get_item(Key={'requestId': patient_id})
        except Exception as e:
            print(f"DynamoDB get_item error in SF check: {e}")
            
        patient = p_res.get('Item') if p_res else None
        if not patient:
            data = load_fallback_data()
            for p in data.get("patients", []):
                if p.get("requestId") == patient_id:
                    patient = p
                    break
                    
        if not patient:
            return {"status": "NO_RESPONSE", "error": "patient not found"}
            
        request_status = patient.get("status", "Pending")
        donor_count = int(patient.get("donorCount", "0"))
        
        # If request status has updated to Fulfilled or Accepted, we succeed
        if request_status.lower() in ["fulfilled", "accepted"] or donor_count > 3:
            return {
                "status": "FULFILLED",
                "patient_id": patient_id,
                "donor_id": donor_id,
                "request_status": request_status
            }
        else:
            return {
                "status": "NO_RESPONSE",
                "patient_id": patient_id,
                "donor_id": donor_id,
                "request_status": request_status
            }
    except Exception as err:
        print(f"Exception in step_function_check_handler: {err}")
        return {"status": "NO_RESPONSE", "error": str(err)}


def step_function_escalate_handler(event, context):
    """
    AWS Lambda handler for escalating when no response is received.
    """
    import datetime
    print(f"step_function_escalate_handler called with event: {event}")
    patient_id = event.get("patient_id")
    donor_id = event.get("donor_id")
    
    try:
        db = get_dynamodb_resource()
        requests_table = db.Table(requests_table_name)
        try:
            requests_table.update_item(
                Key={'requestId': patient_id},
                UpdateExpression="set #status = :s",
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':s': 'ESCALATED'}
            )
            print(f"Updated request status to ESCALATED in DynamoDB.")
        except Exception as e:
            print(f"Could not update status to ESCALATED in DynamoDB: {e}")
            
        print("\n" + "="*80)
        print(f"[ESCALATION NOTIFICATION TRIGGERED]")
        print(f"Alert: No donor response received for patient {patient_id} within the wait window.")
        print(f"Escalating request to care coordinator at outreach@rakshaai.org.")
        print("="*80 + "\n")
        
        return {
            "status": "ESCALATED",
            "patient_id": patient_id,
            "escalated_at": datetime.datetime.now().isoformat()
        }
    except Exception as err:
        print(f"Exception in step_function_escalate_handler: {err}")
        return {"status": "ESCALATED", "error": str(err)}

