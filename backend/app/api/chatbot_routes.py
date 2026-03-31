import difflib
import rapidfuzz
import re
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.database.mongodb import get_database
from app.models.order_model import get_bills_by_customer, get_orders_by_customer, get_revenue_stats
from app.models.user_model import get_user_counts_by_role
from pydantic import BaseModel
from typing import List, Optional, Tuple, Dict
from bson import ObjectId
from rapidfuzz import process, fuzz

router = APIRouter(prefix="/api/chatbot/query", tags=["Chatbot"])

class ChatQuery(BaseModel):
    message: str

# --- SESSION & MEMORY CONFIG ---
# Simple in-memory session store (keyed by user_id)
# Maps user_id -> {"last_intent": str, "last_entity": str, "last_data": dict}
SESSION_MEMORY: Dict[str, Dict] = {}

def get_session(user_id: str) -> Dict:
    if user_id not in SESSION_MEMORY:
        SESSION_MEMORY[user_id] = {"last_intent": None, "last_entity": None, "last_data": None}
    return SESSION_MEMORY[user_id]

def update_session(user_id: str, intent: str = None, entity: str = None, data: dict = None):
    sess = get_session(user_id)
    if intent: sess["last_intent"] = intent
    if entity: sess["last_entity"] = entity
    if data: sess["last_data"] = data

# --- SEMANTIC INTENT MAPS (V2) ---
ADMIN_INTENTS = {
    "today_revenue": ["today revenue", "revenue today", "daily sales", "todays earnings"],
    "total_revenue": ["total revenue", "all time revenue", "total earnings", "overall sales"],
    "active_staff_count": ["active staff", "staff count", "who is working", "number of staff"],
    "today_customers_count": ["today customers", "customer count today", "how many people today"],
    "low_stock": ["low stock", "out of stock", "restock alerts", "stock audit"],
    "expiry_alerts": ["expiry alerts", "expiring medicines", "medicines expiring soon", "show expiry details", "expiry list", "near expiry", "short expiry", "expired medicines", "which medicines expire this month"],
    "medicine_expiry_lookup": ["when does it expire", "expiry of", "validity check", "expiry date for"],
    "dashboard_summary": ["dashboard summary", "system status", "overall health", "give me a summary"]
}

PHARMACIST_INTENTS = {
    "expiry_alerts": ["expiry alerts", "expiring medicines", "medicines expiring soon", "show expiry details", "expiry list", "near expiry", "short expiry", "expired medicines", "which medicines expire this month"],
    "medicine_expiry_lookup": ["when does it expire", "expiry of", "validity check", "expiry date for"],
    "supplier_lookup": ["supplier for", "who supplies", "source of", "provider"],
    "batch_lookup": ["batch details", "batch info", "batch lookup", "batch number"],
    "stock_lookup": ["check stock", "how many", "inventory balance", "stock of"],
    "low_stock": ["low stock list", "items to order", "restock needed"],
    "inventory_intel": ["logs", "recent logs", "activity audit", "stock history"]
}

STAFF_INTENTS = {
    "active_carts": ["active carts", "show carts", "ongoing sessions", "pending checkouts"],
    "find_customer": ["find customer", "look up customer", "search profile", "who is", "search by phone", "locate customer", "customer rahul", "find rahul", "search rahul", "search priya"],
    "stock_lookup": ["check stock", "is it available", "have we got", "stock check"],
    "expiry_alerts": ["expiry alerts", "expiring medicines", "medicines expiring soon", "show expiry details", "expiry list", "near expiry", "short expiry", "expired medicines", "which medicines expire this month"],
    "medicine_search": ["details of", "price check", "info for", "cost of"]
}

CUSTOMER_INTENTS = {
    "last_bill": ["show my last bill", "latest invoice", "my last bill", "recent bill"],
    "last_order": ["show my last order", "latest order", "recent purchase", "track order"],
    "invoice_tracking": ["my invoices", "history of bills", "all invoices", "invoice history"],
    "symptom_search": ["medicine for", "tablet for", "help for", "treatment for", "fever", "cold", "headache", "cough", "pain", "stomach", "acidity", "fever tablets", "headache medicine", "available injections", "injections", "cold medicines", "cough syrup"],
    "medicine_search": ["price of", "details for", "is it available", "how much is"]
}

# --- HELPERS ---

def normalize_query(msg: str) -> str:
    """Lowercase, strip non-essential punctuation, and normalize spaces."""
    msg = msg.lower().strip()
    msg = msg.replace("'s", "s")
    msg = re.sub(r'[?!.,]', '', msg)
    msg = " ".join(msg.split()) 
    return msg

# --- UNIFIED INTENT DETECTION ---
def detect_intent_v2(msg: str, role_map: dict, user_id: str) -> Optional[str]:
    """Detect intent using fuzzy matching and context memory."""
    # Context resolution (Follow-up handling)
    context_keys = ["it", "that", "this", "them", "those", "again", "and", "details"]
    if any(word in msg.split() for word in context_keys):
        sess = get_session(user_id)
        if sess["last_intent"]:
            print(f"🔄 Context Resolved: {sess['last_intent']} (via {msg})")
            return sess["last_intent"]

    # Fuzzy matching against all phrases
    best_match = None
    highest_score = 0
    
    for intent, phrases in role_map.items():
        # Exact match / Substring match
        if any(p in msg for p in phrases):
            return intent
        
        # Fuzzy match
        match = process.extractOne(msg, phrases, scorer=fuzz.token_sort_ratio)
        if match and match[1] > 80: # 80% threshold for intent matching
            if match[1] > highest_score:
                highest_score = match[1]
                best_match = intent
                
    return best_match

def extract_search_entity_v2(msg: str, last_entity: str = None) -> Optional[str]:
    """Extract entity using patterns or memory."""
    if any(word in msg.split() for word in ["it", "this", "that"]) and last_entity:
        return last_entity
        
    patterns = [
        r'(?:for|of|about|check|search|lookup|find|locate|customer|medicines?)\s+([a-zA-Z0-9\s]+)',
        r'(?:stock|price|expiry|batch|supplier)\s+(?:of|for)?\s+([a-zA-Z0-9\s]+)'
    ]
    for p in patterns:
        m = re.search(p, msg)
        if m: 
            found = m.group(1).strip()
            # Clean up trailing noise
            found = re.sub(r'\b(?:medicine|medicines|soon|alerts?|details?|this month)\b', '', found).strip()
            if found: return found
    
    # Fallback to cleaning common noise
    noise = ["show", "me", "the", "details", "info", "is", "available", "last", "latest", "bill", "order", "invoice", "available", "lookup", "find", "search"]
    clean = msg
    for n in noise:
        clean = re.sub(fr'\b{n}\b', '', clean)
    final = clean.strip()
    return final if len(final) > 2 else None

# --- SYMPTOM MAPPING HELPER ---
SYMPTOM_MAP = {
    "fever": {
        "keywords": ["paracetamol", "dolo", "crocin", "pacimol", "calpol"],
        "category": ["Tablet", "Syrup"]
    },
    "headache": {
        "keywords": ["paracetamol", "ibuprofen", "saridon", "dispirin"],
        "category": ["Tablet"]
    },
    "pain": {
        "keywords": ["ibuprofen", "diclofenac", "combiflam", "voveran"],
        "category": ["Tablet", "Ointment", "Gel"]
    },
    "cold": {
        "keywords": ["cetirizine", "okacet", "wikoryl", "solvin"],
        "category": ["Tablet", "Syrup"]
    },
    "cough": {
        "keywords": ["benadryl", "ascoril", "grilinctus", "cough syrup"],
        "category": ["Syrup"]
    },
    "acidity": {
        "keywords": ["digene", "eno", "pantoprazole"],
        "category": ["Tablet", "Syrup", "Powder"]
    },
    "injection": {
        "keywords": [],
        "category": ["Injection"],
        "type": ["Injection"],
        "form": ["Injection"]
    }
}

async def get_expiry_alerts_data(db, days=60):
    """Fetch medicines nearing expiry or already expired."""
    today = datetime.now()
    threshold = today + timedelta(days=days)
    
    # Fetch all medications with expiry_date
    meds = await db["medicines"].find({"expiry_date": {"$exists": True, "$ne": None}}).to_list(None)
    
    expired = []
    expiring_soon = []
    
    for m in meds:
        exp_str = m.get("expiry_date")
        if not exp_str or exp_str == "N/A": continue
        
        try:
            exp_date = datetime.strptime(exp_str, "%Y-%m-%d")
            if exp_date < today:
                m["status_label"] = "EXPIRED"
                expired.append(m)
            elif exp_date <= threshold:
                m["status_label"] = "EXPIRING"
                expiring_soon.append(m)
        except:
            continue # Skip invalid dates
            
    return expired, expiring_soon

# --- MEDICINE & DATA MATCHING ---
async def fuzzy_find_medicine(db, query_str: str) -> Optional[Tuple[dict, str]]:
    if not query_str: return None
    all_meds = await db["medicines"].find().to_list(1000)
    names = [m["name"] for m in all_meds]
    match = process.extractOne(query_str, names, score_cutoff=60)
    if match:
        name, score, index = match
        found = next(m for m in all_meds if m["name"] == name)
        status = "Exact" if score == 100 else "Nearby Match"
        return found, status
    return None

def med_to_card(med, match_label="Similar", disclaimer=None):
    price = med.get("selling_price", med.get("price", med.get("mrp", 0)))
    exp = med.get("expiry_date", "N/A")
    status = "info"
    if exp and exp != "N/A":
        try:
            diff = (datetime.strptime(exp, "%Y-%m-%d") - datetime.now()).days
            status = "danger" if diff <= 0 else "warn" if diff < 180 else "valid"
        except: pass
    return {
        "id": str(med["_id"]),
        "name": med["name"],
        "category": med["category"],
        "price": price,
        "stock": med.get("stock", 0),
        "status": status,
        "expiry_date": exp,
        "batch_number": med.get("batch_number", "GEN"),
        "match_type": match_label,
        "disclaimer": disclaimer
    }

# --- ROLE-BASED HANDLERS (V2) ---
async def handle_admin_query(msg: str, user_id: str, db):
    intent = detect_intent_v2(msg, ADMIN_INTENTS, user_id)
    if not intent: return None
    
    if intent in ["today_revenue", "total_revenue"]:
        is_today = "today" in intent
        stats = await get_revenue_stats(start_date=datetime.now(timezone.utc).replace(hour=0, minute=0, second=0) if is_today else None)
        update_session(user_id, intent)
        period = "Today's" if is_today else "Aggregate"
        return {
            "reply": f"Admin Intelligence Report: {period} revenue is ₹{stats['revenue']:,}. This comprises {stats['bill_count']} validated transactions.",
            "type": "analytics",
            "data": stats
        }
        
    if intent == "active_staff_count":
        counts = await get_user_counts_by_role()
        update_session(user_id, intent)
        return {
            "reply": f"Operational Update: There are currently {counts.get('staff', 0)} clinical staff members synchronized with the central terminal.",
            "type": "analytics",
            "data": {"Staff": counts.get('staff', 0)}
        }
        
    if intent == "expiry_alerts":
        expired, expiring = await get_expiry_alerts_data(db)
        update_session(user_id, intent)
        all_alerts = expired + expiring
        if all_alerts:
            return {
                "reply": f"Security Alert: I detected {len(expired)} expired items and {len(expiring)} items nearing expiry protocols.",
                "recommendations": [med_to_card(m, m['status_label']) for m in all_alerts[:10]],
                "type": "expiry_alerts",
                "data": all_alerts
            }
        return {"reply": "Security Status: All pharmaceutical batches are currently within safe operational dates.", "type": "alert", "data": []}

    if intent == "medicine_expiry_lookup":
        entity = extract_search_entity_v2(msg, sess.get("last_entity"))
        if not entity: return {"reply": "Which medicine should I analyze for expiry?", "type": "prompt"}
        res = await fuzzy_find_medicine(db, entity)
        if res:
            found, label = res
            update_session(user_id, intent, found["name"])
            return {
                "reply": f"Expiry Intelligence: {found['name']} (Batch: {found.get('batch_number', 'N/A')}) expires on {found.get('expiry_date', 'N/A')}.",
                "recommendations": [med_to_card(found, label)],
                "type": "info"
            }
        return {"reply": f"Medicine matching '{entity}' not found.", "type": "fallback"}

    return None

async def handle_pharmacist_query(msg: str, user_id: str, db):
    intent = detect_intent_v2(msg, PHARMACIST_INTENTS, user_id)
    if not intent: return None
    sess = get_session(user_id)
    
    if intent == "expiry_alerts":
        return await handle_admin_query(msg, user_id, db)
        
    if intent in ["stock_lookup", "batch_lookup", "supplier_lookup", "medicine_expiry_lookup"]:
        entity = extract_search_entity_v2(msg, sess.get("last_entity"))
        if not entity: return {"reply": f"Which medicine should I analyze for {intent.replace('_', ' ')}?", "type": "prompt"}
        
        res = await fuzzy_find_medicine(db, entity)
        if res:
            found, label = res
            update_session(user_id, intent, found["name"])
            if intent == "supplier_lookup":
                supp = await db["suppliers"].find_one({"_id": ObjectId(found["supplier_id"])}) if found.get("supplier_id") else None
                if not supp: supp = {"name": found.get("manufacturer", "Direct Dist."), "contact": "Multiple sources"}
                return {
                    "reply": f"Supplier Intel: {found['name']} is deployed by {supp['name']}.",
                    "type": "supplier_lookup",
                    "data": {"medicine_name": found['name'], "supplier_name": supp['name'], "contact": supp.get('contact', 'N/A')}
                }
            if intent == "batch_lookup":
                return {
                    "reply": f"Batch Log: Retrieved parameters for {found['name']}.",
                    "type": "batch_lookup",
                    "data": {"name": found['name'], "batch": found.get('batch_number', 'GEN-01'), "expiry": found.get('expiry_date')}
                }
            return {
                "reply": f"Inventory Report: {found['name']} analysis complete.",
                "recommendations": [med_to_card(found, label)],
                "type": "info"
            }
        return {"reply": f"Medicine matching '{entity}' was not detected in the current vault.", "type": "fallback"}
        
    return None

async def handle_staff_query(msg: str, user_id: str, db):
    intent = detect_intent_v2(msg, STAFF_INTENTS, user_id)
    if not intent: return None
    sess = get_session(user_id)

    if intent == "active_carts":
        from app.models.cart_model import list_all_carts
        carts = await list_all_carts()
        update_session(user_id, intent)
        if not carts: return {"reply": "There are no active billing sessions in progress.", "type": "info"}
        processed = [{"id": c["id"], "customer_name": c.get("customer_name", "Walk-in"), "total": sum(m["price"] * m["quantity"] for m in c["medicines"])} for c in carts[:5]]
        return {"reply": f"Detected {len(processed)} active carts awaiting final dispatch.", "type": "carts", "data": processed}

    if intent == "find_customer":
        name = extract_search_entity_v2(msg, sess.get("last_entity"))
        if not name: return {"reply": "Which customer profile or phone should I retrieve?", "type": "prompt"}
        
        # 1. Search by Phone (Partial)
        all_customers = await db["customers"].find().to_list(1000)
        phone_matches = [c for c in all_customers if name in c.get("phone", "")]
        
        # 2. Fuzzy Search by Name
        cust_names = [c["name"] for c in all_customers]
        fuzzy_results = process.extract(name, cust_names, scorer=fuzz.token_sort_ratio, limit=5)
        name_matches_names = [r[0] for r in fuzzy_results if r[1] > 60]
        name_matches = [c for c in all_customers if c["name"] in name_matches_names]
        
        # Combine and Deduplicate
        seen_ids = set()
        matches = []
        for c in phone_matches + name_matches:
            if str(c["_id"]) not in seen_ids:
                matches.append(c)
                seen_ids.add(str(c["_id"]))
        
        update_session(user_id, intent, name)
        if matches:
            return {
                "reply": f"Identity Sync: I found {len(matches)} matching profiles.", 
                "type": "customers", 
                "data": [{"name": c["name"], "phone": c["phone"], "customer_id": str(c.get("customer_id", c["_id"]))} for c in matches[:5]]
            }
        return {"reply": f"No identity profile matching '{name}' was detected. Try exact phone or different name.", "type": "fallback"}

    if intent == "expiry_alerts":
        return await handle_admin_query(msg, user_id, db)

    if intent in ["stock_lookup", "medicine_search"]:
        entity = extract_search_entity_v2(msg, sess.get("last_entity"))
        res = await fuzzy_find_medicine(db, entity)
        if res:
            found, label = res
            update_session(user_id, intent, found["name"])
            return {"reply": f"Deployment Specs: {found['name']} details synchronized.", "recommendations": [med_to_card(found, label)], "type": "info"}
        return {"reply": f"Requested item '{entity}' not found.", "type": "fallback"}

    return None

async def handle_customer_query(msg: str, user_id: str, db):
    intent = detect_intent_v2(msg, CUSTOMER_INTENTS, user_id)
    if not intent: return None
    sess = get_session(user_id)

    if intent in ["last_bill", "invoice_tracking"]:
        from app.models.order_model import get_bills_by_customer
        bills = await get_bills_by_customer(user_id)
        if not bills: return {"reply": "No historical invoices were detected for your profile.", "type": "info"}
        bills.sort(key=lambda x: x["created_at"], reverse=True)
        if intent == "last_bill":
            bill = bills[0]
            update_session(user_id, intent, data={"bill_id": bill["bill_id"]})
            return {
                "reply": "Here is your most recent digital invoice summary.",
                "type": "bill",
                "data": {"id": bill["bill_id"], "date": bill["created_at"].strftime("%Y-%m-%d"), "total": bill["total"], "item_count": len(bill["medicines"])}
            }
        return {"reply": f"Securely retrieved your last {min(len(bills), 3)} invoices.", "type": "invoices", "data": bills[:3]}

    if intent == "symptom_search":
        # Extract symptom keyword from msg using SYMPTOM_MAP keys
        matched_symptom = None
        for s in SYMPTOM_MAP.keys():
            if s in msg:
                matched_symptom = s
                break
        
        if not matched_symptom:
            return {"reply": "Could you specify the symptom? (e.g., medicines for fever, headache, pain, cold or available injections).", "type": "prompt"}
        
        config = SYMPTOM_MAP[matched_symptom]
        query_filter = {"stock": {"$gt": 0}} # Only in-stock items
        
        # Build complex OR query for symptom
        or_conditions = []
        if config["keywords"]:
            or_conditions.append({"name": {"$regex": "|".join(config["keywords"]), "$options": "i"}})
        if config.get("category"):
            or_conditions.append({"category": {"$in": config["category"]}})
        if config.get("type"):
            or_conditions.append({"type": {"$in": config["type"]}})
        if config.get("form"):
            or_conditions.append({"form": {"$in": config["form"]}})
            
        if or_conditions:
            query_filter["$or"] = or_conditions
            
        meds = await db["medicines"].find(query_filter).to_list(10)
        
        # Additional Expiry filtering (only unexpired)
        today = datetime.now()
        verified_meds = []
        for m in meds:
            exp_str = m.get("expiry_date")
            if exp_str and exp_str != "N/A":
                try:
                    if datetime.strptime(exp_str, "%Y-%m-%d") < today: continue
                except: pass
            verified_meds.append(m)
            
        update_session(user_id, intent, matched_symptom)
        if verified_meds:
            return {
                "reply": f"Clinical Guidance: For {matched_symptom}, these options are available in stock. For proper medical advice, consult a pharmacist.",
                "recommendations": [med_to_card(m, "Symptom Relief", disclaimer="Consult Pharmacist for Dosage.") for m in verified_meds],
                "type": "symptom_search"
            }
        return {"reply": f"Clinical Alert: No matching in-stock medications for {matched_symptom} were detected in the system.", "type": "fallback"}

    return None

# --- MAIN ENDPOINT ---
@router.post("/")
async def chat_query(query: ChatQuery, current_user: dict = Depends(get_current_user)):
    db = get_database()
    msg = normalize_query(query.message)
    role = current_user.get("role", "").lower()
    uid = str(current_user.get("id", ""))
    
    print(f"🤖 Assistant Debug | Role: {role} | Query: {msg}")
    
    res = None
    if role == "admin": res = await handle_admin_query(msg, uid, db)
    elif role == "pharmacist": res = await handle_pharmacist_query(msg, uid, db)
    elif role == "staff": res = await handle_staff_query(msg, uid, db)
    elif role == "customer": res = await handle_customer_query(msg, uid, db)
    
    if res:
        print(f"✅ Intent Detected: {res.get('intent', 'N/A')} | Reply Type: {res.get('type')}")
    else:
        # Global fallback: fuzzy medicine search
        entity = extract_search_entity_v2(msg)
        print(f"🔍 Global Fallback Search: {entity}")
        if entity:
            med_res = await fuzzy_find_medicine(db, entity)
            if med_res:
                found, label = med_res
                print(f"💊 Found Medicine: {found['name']}")
                res = {"reply": f"Clinical Status: I found {found['name']} in the medicine catalog.", "recommendations": [med_to_card(found, label)], "type": "info"}
        
    if not res:
        print("❌ No Intent or Match Found")
        res = {"reply": "I'm sorry, I couldn't process that request within your current authorized role or the medicine is not in our system.", "type": "fallback"}
        
    return res
