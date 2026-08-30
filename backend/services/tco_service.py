import os
from decimal import Decimal
from typing import Optional

class TCOService:
    def __init__(self):
        # Default horizon to 1 year, configurable via env
        self.horizon_years = int(os.getenv("TCO_HORIZON_YEARS", "1"))

    def calculate_tco(self, subscription_cost: Optional[float], implementation_cost: Optional[float], support_cost: Optional[float], usage_cost: Optional[float], additional_costs: Optional[float]) -> dict:
        total = 0.0
        is_estimated = False
        
        # We need at least subscription cost to have a meaningful TCO, but we'll try to sum what we have.
        # Recurring costs: subscription, support, usage
        if subscription_cost is not None:
            total += subscription_cost * self.horizon_years
        else:
            is_estimated = True
            
        if support_cost is not None:
            total += support_cost * self.horizon_years
        
        if usage_cost is not None:
            total += usage_cost * self.horizon_years

        # One-time costs: implementation, additional
        if implementation_cost is not None:
            total += implementation_cost
            
        if additional_costs is not None:
            total += additional_costs
            
        # If absolutely everything is None, TCO is unknown
        if all(x is None for x in [subscription_cost, implementation_cost, support_cost, usage_cost, additional_costs]):
            return {
                "estimated_tco": None,
                "is_estimated": True,
                "horizon_years": self.horizon_years
            }

        return {
            "estimated_tco": total,
            "is_estimated": is_estimated,
            "horizon_years": self.horizon_years
        }
