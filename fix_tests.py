import re

path = 'src/lib/utils/vacationLogic.test.ts'
with open(path, 'r') as f:
    content = f.read()

content = re.sub(
    r"calculateEmployeeBalance\(([^,]+),\s*([^,]+),\s*new Date\(([^)]+)\)\)",
    r"calculateEmployeeBalance(\1, \2, [], [], new Date(\3))",
    content
)

with open(path, 'w') as f:
    f.write(content)
