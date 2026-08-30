import time
from collections import defaultdict

class PerfLogger:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PerfLogger, cls).__new__(cls)
            cls._instance.metrics = defaultdict(float)
            cls._instance.counts = defaultdict(int)
        return cls._instance

    def log_time(self, category, duration):
        self.metrics[category] += duration
        self.counts[category] += 1
        print(f"[PERF] {category}: {duration:.2f} seconds")
        
    def log_event(self, category):
        self.counts[category] += 1
        print(f"[PERF] {category}")

perf_logger = PerfLogger()

def timeit(category):
    def decorator(func):
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            duration = time.time() - start
            perf_logger.log_time(category, duration)
            return result
        return wrapper
    return decorator

def async_timeit(category):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start = time.time()
            result = await func(*args, **kwargs)
            duration = time.time() - start
            perf_logger.log_time(category, duration)
            return result
        return wrapper
    return decorator
