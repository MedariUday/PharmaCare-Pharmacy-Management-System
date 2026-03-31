from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from app.database.mongodb import get_database
from app.api.deps import get_current_admin, get_current_staff, get_current_pharmacist

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/daily-sales", dependencies=[Depends(get_current_staff)])
async def daily_sales():
    db = get_database()
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    sales = db["bills"].find({"created_at": {"$gte": today}})
    
    total_sales = 0
    count = 0
    async for sale in sales:
        total_sales += sale.get("total", 0)
        count += 1
    
    # For chart: last 7 days daily sales
    seven_days_ago = today - timedelta(days=7)
    chart_data = []
    for i in range(7):
        day = seven_days_ago + timedelta(days=i)
        next_day = day + timedelta(days=1)
        day_sales = await db["bills"].aggregate([
            {"$match": {
                "$or": [
                    {"created_at": {"$gte": day, "$lt": next_day}},
                    {"created_at": {"$gte": day.replace(tzinfo=None), "$lt": next_day.replace(tzinfo=None)}}
                ]
            }},
            {"$group": {"_id": None, "total": {"$sum": "$total"}}}
        ]).to_list(1)
        total = day_sales[0]["total"] if day_sales else 0
        chart_data.append({"name": day.strftime("%a"), "revenue": total})

    return {
        "date": today.strftime("%Y-%m-%d"), 
        "total_sales": total_sales, 
        "sales_count": count,
        "chart_data": chart_data
    }

@router.get("/monthly-revenue", dependencies=[Depends(get_current_pharmacist)])
async def monthly_sales():
    db = get_database()
    today = datetime.now(timezone.utc)
    first_day = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    sales = db["bills"].find({"created_at": {"$gte": first_day}})
    
    total_sales = 0
    count = 0
    async for sale in sales:
        total_sales += sale.get("total", 0)
        count += 1
    
    # For chart: monthly revenue for last 6 months
    chart_data = []
    for i in range(5, -1, -1):
        # Approximate month subtraction
        month_start = (first_day - timedelta(days=i*30)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        
        month_sales = await db["bills"].aggregate([
            {"$match": {
                "$or": [
                    {"created_at": {"$gte": month_start, "$lt": month_end}},
                    {"created_at": {"$gte": month_start.replace(tzinfo=None), "$lt": month_end.replace(tzinfo=None)}}
                ]
            }},
            {"$group": {"_id": None, "total": {"$sum": "$total"}}}
        ]).to_list(1)
        total = month_sales[0]["total"] if month_sales else 0
        chart_data.append({"name": month_start.strftime("%b"), "revenue": total})

    return {
        "month": today.strftime("%Y-%m"), 
        "total_sales": total_sales, 
        "sales_count": count,
        "chart_data": chart_data
    }

@router.get("/top-medicines", dependencies=[Depends(get_current_pharmacist)])
async def top_selling_medicines():
    db = get_database()
    # Unwind medicines array in bills and group by medicine_id
    pipeline = [
        {"$unwind": "$medicines"},
        {"$group": {
            "_id": "$medicines.medicine_id",
            "name": {"$first": {"$ifNull": ["$medicines.medicine_name", "$medicines.name"]}},
            "total_sold": {"$sum": "$medicines.quantity"}
        }},
        {"$sort": {"total_sold": -1}},
        {"$limit": 10}
    ]
    results = await db["bills"].aggregate(pipeline).to_list(10)
    return results

@router.get("/summary", dependencies=[Depends(get_current_pharmacist)])
async def admin_report_summary():
    db = get_database()
    # Use naive UTC for comparison if DB stores naive, or aware if aware. 
    # To be safest, we calculate UTC midnight and ensure it matches the 14:13 UTC records.
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    # Strip timezone for comparison if suspecting naive DB storage
    today_start_naive = today_start.replace(tzinfo=None)
    
    # Total Revenue and Bills
    pipeline_total = [
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$total"},
            "total_bills": {"$sum": 1}
        }}
    ]
    total_res = await db["bills"].aggregate(pipeline_total).to_list(1)
    total_revenue = total_res[0]["total_revenue"] if total_res else 0
    total_bills = total_res[0]["total_bills"] if total_res else 0

    # Today's Revenue and Bills
    pipeline_today = [
        {"$match": {
            "$or": [
                {"created_at": {"$gte": today_start}},
                {"created_at": {"$gte": today_start_naive}}
            ]
        }},
        {"$group": {
            "_id": None,
            "today_revenue": {"$sum": "$total"},
            "today_bills": {"$sum": 1}
        }}
    ]
    today_res = await db["bills"].aggregate(pipeline_today).to_list(1)
    today_revenue = today_res[0]["today_revenue"] if today_res else 0
    today_bills = today_res[0]["today_bills"] if today_res else 0

    # Total Customers
    total_customers = await db["customers"].count_documents({})

    # Low Stock Items (threshold matches what's used elsewhere or default to 10)
    low_stock_count = await db["medicines"].count_documents({"stock": {"$lte": 10}})

    return {
        "total_revenue": total_revenue,
        "today_revenue": today_revenue,
        "total_bills": total_bills,
        "today_bills": today_bills,
        "total_customers": total_customers,
        "low_stock_count": low_stock_count
    }

@router.get("/clinical-analytics", dependencies=[Depends(get_current_pharmacist)])
async def clinical_analytics():
    db = get_database()
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)
    
    # 1. 30-Day Basic Stats
    pipeline_30d = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": None,
            "revenue": {"$sum": "$total"},
            "orders": {"$sum": 1}
        }}
    ]
    thirty_day_res = await db["bills"].aggregate(pipeline_30d).to_list(1)
    rev_30d = thirty_day_res[0]["revenue"] if thirty_day_res else 0
    orders_30d = thirty_day_res[0]["orders"] if thirty_day_res else 0
    
    # 2. 7-Day Revenue Velocity (Trend)
    chart_data = []
    for i in range(7):
        day = (now - timedelta(days=6-i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_naive = day.replace(tzinfo=None)
        next_day = day + timedelta(days=1)
        next_day_naive = next_day.replace(tzinfo=None)
        
        day_sales = await db["bills"].aggregate([
            {"$match": {
                "$or": [
                    {"created_at": {"$gte": day, "$lt": next_day}},
                    {"created_at": {"$gte": day_naive, "$lt": next_day_naive}}
                ]
            }},
            {"$group": {"_id": None, "total": {"$sum": "$total"}}}
        ]).to_list(1)
        total = day_sales[0]["total"] if day_sales else 0
        chart_data.append({"name": day.strftime("%a"), "revenue": total})

    # 3. Estimated Profit Margin (Last 30 Days)
    # Flexible Jion: Handles medicine_id as String matching MongoDB _id (ObjectId or String)
    profit_pipeline = [
        {"$match": {
            "$or": [
                {"created_at": {"$gte": thirty_days_ago}},
                {"created_at": {"$gte": thirty_days_ago.replace(tzinfo=None)}}
            ]
        }},
        {"$unwind": "$medicines"},
        {"$lookup": {
            "from": "medicines",
            "let": {"search_id_str": "$medicines.medicine_id"},
            "pipeline": [
                {"$match": {
                    "$expr": {
                        "$or": [
                            {"$eq": [{"$toString": "$_id"}, "$$search_id_str"]},
                            {"$eq": ["$_id", "$$search_id_str"]}
                        ]
                    }
                }}
            ],
            "as": "med_info"
        }},
        {"$unwind": {"path": "$med_info", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "profit": {
                "$multiply": [
                    {"$subtract": [
                        {"$ifNull": ["$medicines.price", 0]}, 
                        {"$ifNull": ["$med_info.purchase_price", 0]}
                    ]},
                    {"$ifNull": ["$medicines.quantity", 0]}
                ]
            }
        }},
        {"$group": {"_id": None, "total_profit": {"$sum": "$profit"}}}
    ]
    profit_res = await db["bills"].aggregate(profit_pipeline).to_list(1)
    estimated_profit = profit_res[0]["total_profit"] if profit_res else 0

    # 4. Category Market Share (Distribution)
    # Logic: Prioritize archived category in bill, fallback to medicines collection
    cat_pipeline = [
        {"$match": {
            "$or": [
                {"created_at": {"$gte": thirty_days_ago}},
                {"created_at": {"$gte": thirty_days_ago.replace(tzinfo=None)}}
            ]
        }},
        {"$unwind": "$medicines"},
        {"$lookup": {
            "from": "medicines",
            "let": {"search_id_str": "$medicines.medicine_id"},
            "pipeline": [
                {"$match": {
                    "$expr": {
                        "$or": [
                            {"$eq": [{"$toString": "$_id"}, "$$search_id_str"]},
                            {"$eq": ["$_id", "$$search_id_str"]}
                        ]
                    }
                }}
            ],
            "as": "med_info"
        }},
        {"$unwind": {"path": "$med_info", "preserveNullAndEmptyArrays": True}},
        {"$group": {
            "_id": {
                "$ifNull": [
                    "$medicines.category",
                    {"$ifNull": ["$med_info.category", "General"]}
                ]
            },
            "value": {
                "$sum": {
                    "$multiply": [
                        {"$ifNull": ["$medicines.price", 0]},
                        {"$ifNull": ["$medicines.quantity", 0]}
                    ]
                }
            }
        }},
        {"$sort": {"value": -1}}
    ]
    category_data = await db["bills"].aggregate(cat_pipeline).to_list(10)
    # Filter out null or empty names and ensure value is rounded
    category_data = [
        {
            "name": str(c["_id"]) if c["_id"] else "General", 
            "value": round(c["value"], 2)
        } 
        for c in category_data if c["_id"]
    ]

    # 5. Inventory Health (Urgent Restocks)
    # Count where stock <= minimum_stock (Fallback to 10 if missing)
    # Total count for debug comparison
    total_meds = await db["medicines"].count_documents({})
    urgent_restock_pipeline = [
        {
            "$match": {
                "$expr": {
                    "$lte": [
                        {"$toInt": {"$ifNull": ["$stock", 0]}},
                        {"$toInt": {"$ifNull": ["$minimum_stock", 10]}}
                    ]
                }
            }
        },
        {"$count": "count"}
    ]
    urgent_res = await db["medicines"].aggregate(urgent_restock_pipeline).to_list(1)
    urgent_restock_count = urgent_res[0]["count"] if urgent_res else 0
    
    print(f"📊 DEBUG: Clinical Stats Compiled. Total Meds: {total_meds}, Urgent Restocks: {urgent_restock_count}")
    
    return {
        "revenue_30d": rev_30d,
        "orders_30d": orders_30d,
        "profit_30d": estimated_profit,
        "urgent_restocks": urgent_restock_count,
        "revenue_trend": chart_data,
        "category_share": category_data
    }
