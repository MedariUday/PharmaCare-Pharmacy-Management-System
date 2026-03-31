from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.database.mongodb import get_database
from app.models.order_model import get_bills_by_customer
from typing import List
import random

router = APIRouter(prefix="/api/customer/recommendations", tags=["Recommendations"])

# Hardcoded rules for common cross-sells
RECOMMENDATION_RULES = {
    "Fever": ["Vitamin C", "ORS", "Thermometer"],
    "Cough": ["Lozenges", "Steamer", "Vaporub"],
    "Pain": ["Pain Relief Gel", "Heat Pad"],
    "Antibiotics": ["Probiotics", "Multi-vitamins"]
}

@router.get("/")
async def get_recommendations(current_user: dict = Depends(get_current_user)):
    db = get_database()
    customer_id = current_user.get("id")
    
    # 1. Fetch customer purchase history
    bills = await get_bills_by_customer(customer_id)
    
    # Extract bought categories and medicine names
    bought_categories = set()
    bought_names = set()
    for bill in bills:
        for med in bill.get("medicines", []):
            cat = med.get("category", "")
            if cat: bought_categories.add(cat)
            bought_names.add(med.get("medicine_name", "").lower())
            
    recommendations = []
    
    # 2. Apply Rule-based Recommendations
    for cat in bought_categories:
        if cat in RECOMMENDATION_RULES:
            for rec_name in RECOMMENDATION_RULES[cat]:
                # Find the medicine in DB to get price and ID
                med = await db["medicines"].find_one({"name": {"$regex": f"^{rec_name}$", "$options": "i"}})
                if med and med["name"].lower() not in bought_names:
                    recommendations.append({
                        "medicine_id": str(med["_id"]),
                        "name": med["name"],
                        "price": med.get("selling_price", med.get("price", 0)),
                        "category": med["category"],
                        "reason": f"Based on your interest in {cat}"
                    })

    # 3. Category Similarity (Random items from same categories)
    if bought_categories:
        pipeline = [
            {"$match": {"category": {"$in": list(bought_categories)}, "name": {"$nin": list(bought_names)}}},
            {"$sample": {"size": 5}}
        ]
        cat_items = await db["medicines"].aggregate(pipeline).to_list(10)
        for item in cat_items:
            if not any(r["medicine_id"] == str(item["_id"]) for r in recommendations):
                recommendations.append({
                    "medicine_id": str(item["_id"]),
                    "name": item["name"],
                    "price": item.get("selling_price", item.get("price", 0)),
                    "category": item["category"],
                    "reason": "Popular in your favorite categories"
                })

    # 4. Global Popularity (Fallback if history is empty)
    if not recommendations:
        top_items = await db["medicines"].find().sort("stock", -1).limit(5).to_list(5)
        for item in top_items:
            recommendations.append({
                "medicine_id": str(item["_id"]),
                "name": item["name"],
                "price": item.get("selling_price", item.get("price", 0)),
                "category": item["category"],
                "reason": "Top trending today"
            })

    # Shuffle and limit
    random.shuffle(recommendations)
    return {"recommendations": recommendations[:6]}
