from analyzer.product_identity import extract_product_identity_obj
import json

r = extract_product_identity_obj("Apple iPhone 15 128GB Black")
for k, v in r.items():
    print(f"  {k}: {type(v).__name__} = {repr(v)[:60]}")

print("\nJSON test:")
try:
    print(json.dumps(r))
    print("OK")
except TypeError as e:
    print("FAIL:", e)
