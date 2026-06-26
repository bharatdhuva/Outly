import re

with open("c:/Users/dhuva/Desktop/Bharat Dhuva/Projects/Outly/frontend/src/pages/Landing.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove comments to avoid false matches
content_no_comments = re.sub(r"{/\*.*?\*/}", "", content, flags=re.DOTALL)
content_no_comments = re.sub(r"//.*", "", content_no_comments)

tokens = re.split(r"(<[^>]+>)", content_no_comments)
line_num = 1
stack = []

for token in tokens:
    line_num += token.count("\n")
    if token.startswith("<") and token.endswith(">"):
        if token.startswith("<!--"):
            continue
        if token.endswith("/>"):
            continue
        
        match = re.match(r"^<(/?[a-zA-Z0-9_\-]+)", token)
        if match:
            tag_name = match.group(1)
            if tag_name in ["circle", "rect", "path", "circle", "line", "poly", "meta", "link", "input", "br", "hr", "img"]:
                continue
            
            if tag_name.startswith("/"):
                closing_name = tag_name[1:]
                if not stack:
                    print(f"[{line_num}] POP ERROR: Unexpected closing tag </{closing_name}>")
                else:
                    opened_name, opened_line = stack.pop()
                    print(f"[{line_num}] POP: </{closing_name}> matched with <{opened_name}> from line {opened_line}")
                    if opened_name != closing_name:
                        print(f"  --> MISMATCH ERROR!")
            else:
                stack.append((tag_name, line_num))
                print(f"[{line_num}] PUSH: <{tag_name}>")

print("\nRemaining stack:")
for tag_name, line in stack:
    print(f"Unclosed <{tag_name}> opened at line {line}")
