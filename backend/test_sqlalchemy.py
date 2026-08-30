import os
import sys

# Add root to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine
from backend.models.models import Evaluation, Requirement, Vendor
from sqlalchemy import text
from uuid import uuid4

def test_db():
    print("Testing SQLAlchemy Connection...")
    
    try:
        # Test basic connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("1. SQLAlchemy connected to Supabase PostgreSQL successfully.")
            
        db = SessionLocal()
        
        # Test Create Evaluation
        test_eval = Evaluation(name="Test Evaluation", description="Test Desc")
        db.add(test_eval)
        db.commit()
        db.refresh(test_eval)
        eval_id = test_eval.id
        print(f"2. Successfully inserted Evaluation (ID: {eval_id})")
        
        # Test Retrieve Evaluation
        retrieved_eval = db.query(Evaluation).filter(Evaluation.id == eval_id).first()
        if retrieved_eval and retrieved_eval.name == "Test Evaluation":
            print("3. Successfully retrieved Evaluation.")
            
        # Test Add Requirement
        test_req = Requirement(evaluation_id=eval_id, name="Test Req", priority="must_have")
        db.add(test_req)
        db.commit()
        print("4. Successfully added Requirement.")
        
        # Test Add Vendor
        test_vendor = Vendor(evaluation_id=eval_id, name="Test Vendor")
        db.add(test_vendor)
        db.commit()
        print("5. Successfully added Vendor.")
        
        print("All tests passed! Records should now appear in the Supabase Table Editor.")
        
    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    test_db()
