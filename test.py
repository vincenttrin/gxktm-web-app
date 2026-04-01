import re
match = re.search(r'\d+', "Giao Ly 5b")
if match:
    print(int(match.group()))