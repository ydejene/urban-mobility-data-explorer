# backend\security\validator.py
# Request Validation Layer: Validates incoming API request parameters to ensure security and data integrity.

class RequestValidator:
    """Security Layer: Validates incoming API request parameters"""
    
    @staticmethod
    def validate_summary_params(params):
        """
        Validates parameters for the /api/trips/summary endpoint.
        Expected: year (int), month (int), borough (optional, string)
        """
        # 1. Validate 'year' if provided
        if 'year' in params:
            try:
                year = int(params['year'])
                if not (2000 <= year <= 2026):
                    return False, "Invalid year range. Must be between 2000 and 2026."
            except ValueError:
                return False, "'year' must be an integer."
        
        # 2. Validate 'month' if provided
        if 'month' in params:
            try:
                month = int(params['month'])
                if not (1 <= month <= 12):
                    return False, "Invalid month. Must be between 1 and 12."
            except ValueError:
                return False, "'month' must be an integer."
                
        # 3. Future expansions: borough name validation against DB lookup
        
        return True, ""
