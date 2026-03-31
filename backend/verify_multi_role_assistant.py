import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.curdir))

from app.api.chatbot_routes import normalize_query, detect_role_intent, extract_search_entity, STAFF_INTENTS, CUSTOMER_INTENTS

def test_multi_role_logic():
    staff_cases = [
        ("Show active carts", "active_carts", ""),
        ("Find customer Rahul", "find_customer", "rahul"),
        ("Check stock of Dolo 650", "stock_lookup", "dolo 650"),
    ]
    
    customer_cases = [
        ("Show my last bill", "last_bill", ""),
        ("Show my last order", "last_order", ""),
        ("What medicines are available for fever?", "symptom_search", "fever"),
        ("Track invoices", "invoice_tracking", ""),
    ]
    
    print("🧪 STARTING MULTI-ROLE INTENT VERIFICATION")
    print("-" * 60)
    
    print("📋 STAFF ASSISTANT TESTS:")
    for query, expected_intent, expected_ent in staff_cases:
        clean = normalize_query(query)
        intent = detect_role_intent(clean, STAFF_INTENTS)
        extracted = extract_search_entity(clean, intent) if intent else "N/A"
        status = "✅" if intent == expected_intent and (not expected_ent or expected_ent in extracted) else "❌"
        print(f"{status} Q: '{query}' -> Intent: {intent} | Extracted: {extracted}")

    print("-" * 60)
    print("📋 CUSTOMER ASSISTANT TESTS:")
    for query, expected_intent, expected_ent in customer_cases:
        clean = normalize_query(query)
        intent = detect_role_intent(clean, CUSTOMER_INTENTS)
        extracted = extract_search_entity(clean, intent) if intent else "N/A"
        status = "✅" if intent == expected_intent and (not expected_ent or expected_ent in extracted) else "❌"
        print(f"{status} Q: '{query}' -> Intent: {intent} | Extracted: {extracted}")

if __name__ == "__main__":
    test_multi_role_logic()
