import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.curdir))

from app.api.chatbot_routes import normalize_query, detect_role_intent, extract_medicine_entity, PHARMACIST_INTENTS

def test_assistant_logic():
    test_cases = [
        ("Show expiry details", "expiry_alerts", ""),
        ("Who is the supplier for Paracetamol?", "supplier_lookup", "paracetamol"),
        ("Batch details of Crocin", "batch_lookup", "crocin"),
        ("expiry of para", "medicine_expiry_lookup", "para"),
        ("supplier of paracetmol", "supplier_lookup", "paracetmol"),
        ("stock of dolo 65", "stock_lookup", "dolo 65")
    ]
    
    print("🧪 STARTING ASSISTANT INTENT VERIFICATION")
    print("-" * 50)
    
    for query, expected_intent, expected_med in test_cases:
        clean = normalize_query(query)
        intent = detect_role_intent(clean, PHARMACIST_INTENTS)
        extracted = extract_medicine_entity(clean, intent) if intent else "N/A"
        
        status = "✅" if intent == expected_intent and (intent == "expiry_alerts" or extracted == expected_med) else "❌"
        
        print(f"{status} Query: '{query}'")
        print(f"   Intent:   {intent} (Expected: {expected_intent})")
        print(f"   Extracted: {extracted} (Expected: {expected_med})")
        print("-" * 50)

if __name__ == "__main__":
    test_assistant_logic()
