
import os
import re
import subprocess
from datetime import datetime


project_folder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

pdf_name = os.path.join(project_folder, "roll number.pdf")
text_name = os.path.join(project_folder, "student_data.txt")
data_folder = os.path.join(project_folder, "src", "data")
output_file = os.path.join(data_folder, "students.txt")

DEFAULT_PASSWORD = "student@123"

os.makedirs(data_folder, exist_ok=True)

if not os.path.exists(pdf_name):
    print("ERROR: roll number.pdf was not found.")
    raise SystemExit(1)


try:
    subprocess.run(
        ["pdftotext", pdf_name, text_name],
        check=True
    )
except FileNotFoundError:
    print("ERROR: pdftotext is not installed or not in PATH.")
    raise SystemExit(1)
except subprocess.CalledProcessError:
    print("ERROR: Could not extract text from the PDF.")
    raise SystemExit(1)

with open(text_name, "r", encoding="utf-8", errors="ignore") as file:
    pdf_text = file.read()


roll_numbers = set(re.findall(r"\b\d{7}\b", pdf_text))

if not roll_numbers:
    print("ERROR: No seven-digit roll numbers found in the PDF.")
    raise SystemExit(1)

students = {}


if os.path.exists(output_file):
    with open(output_file, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()

            if not line:
                continue

            fields = line.split("|||")

            if len(fields) == 6:
                roll, name, course, semester, password, first_login = fields

            elif len(fields) == 5:
                # Old format:
                # roll|||name|||semester|||password|||firstLogin
                roll, name, semester, password, first_login = fields
                course = ""

            else:
                print("Skipping invalid record:", line)
                continue

            if not roll:
                continue

            students[roll] = [
                roll,
                name,
                course,
                semester,
                password,
                first_login
            ]


new_students = 0

for roll in sorted(roll_numbers):
    if roll not in students:
        students[roll] = [
            roll,
            "",
            "",
            "0",
            DEFAULT_PASSWORD,
            "1"
        ]
        new_students += 1


if os.path.exists(output_file):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = output_file + "." + timestamp + ".bak"
    with open(output_file, "rb") as source:
        with open(backup_file, "wb") as backup:
            backup.write(source.read())


temp_file = output_file + ".tmp"

with open(temp_file, "w", encoding="utf-8") as file:
    for record in students.values():
        file.write("|||".join(record) + "\n")


os.replace(temp_file, output_file)

print("\nSTUDENT DATABASE UPDATED SUCCESSFULLY!")
print("PDF roll numbers found:", len(roll_numbers))
print("New students added:", new_students)
print("Total student records:", len(students))
print("Output file:", output_file)
