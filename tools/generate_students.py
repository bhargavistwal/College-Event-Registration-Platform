
import subprocess
import re
import os
import sys

project_folder = r"C:\Users\bharg\OneDrive\Documents\COLLEGE-EVENT-REGISTRATION-PLATFORM"

pdf_name = os.path.join(project_folder, "roll number.pdf")
text_name = os.path.join(project_folder, "student_data.txt")
data_folder = os.path.join(project_folder, "src", "data")
output_file = os.path.join(data_folder, "students.txt")

if not os.path.isfile(pdf_name):
    print("ERROR: PDF not found:", pdf_name)
    sys.exit(1)

try:
    subprocess.run(["pdftotext", pdf_name, text_name], check=True)
except FileNotFoundError:
    print("ERROR: pdftotext is not installed or not in PATH.")
    sys.exit(1)
except subprocess.CalledProcessError:
    print("ERROR: Could not convert the PDF.")
    sys.exit(1)

with open(text_name, "r", encoding="utf-8", errors="ignore") as file:
    data = file.read()

roll_numbers = list(dict.fromkeys(re.findall(r"\b\d{7}\b", data)))

if not roll_numbers:
    print("ERROR: No 7-digit roll numbers found.")
    sys.exit(1)

os.makedirs(data_folder, exist_ok=True)

if os.path.exists(output_file):
    with open(output_file, "rb") as old_file:
        old_data = old_file.read()
    with open(output_file + ".bak", "wb") as backup:
        backup.write(old_data)

with open(output_file, "w", encoding="utf-8") as file:
    for roll in roll_numbers:
        file.write(f"{roll}||||||0|||student@123|||1\n")

if os.path.isfile(output_file):
    print("STUDENT DATABASE CREATED SUCCESSFULLY!")
    print("Total students:", len(roll_numbers))
    print("Full file path:", output_file)
    print("File size:", os.path.getsize(output_file), "bytes")

    with open(output_file, "r", encoding="utf-8") as file:
        print("\nFirst 5 records:")
        for i, line in enumerate(file):
            if i == 5:
                break
            print(line.rstrip())
else:
    print("ERROR: students.txt was not created.")
