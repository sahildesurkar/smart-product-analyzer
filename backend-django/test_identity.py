from analyzer.product_identity import extract_product_identity_obj, generate_optimized_query

cases = [
    'Apple iPhone 15 128GB Black',
    'Shlovashi Woven Banarasi Art Silk Saree',
    'Boat Rockerz 450 Bluetooth Headphones',
    'realme Narzo 80 Lite 5G 128 GB 4 GB RAM',
    'JBL Tune 230NC TWS Earbuds',
    'Dell Inspiron 15 Intel Core i5 16GB RAM 512GB SSD Laptop',
]

for title in cases:
    ident = extract_product_identity_obj(title)
    q = generate_optimized_query(ident)
    print("TITLE   :", title)
    print("  cat=%s brand=%s model=%s storage=%s type=%s material=%s wireless=%s" % (
        ident["category"], ident["brand"], ident["model"],
        ident["storage"], ident["type"], ident["material"], ident["wireless"]
    ))
    print("  QUERY  :", q)
    print()
