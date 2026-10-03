import subprocess
import re

pdf_name = "roll number.pdf"
text_name = "student_data.txt"

subprocess.run(["pdftotext", pdf_name, text_name])

with open(text_name, "r", encoding="utf-8", errors="ignore") as file:
    data = file.read()

roll_numbers = re.findall(r"\b\d{7}\b", data)

roll_numbers = list(set(roll_numbers))

with open("src/data/students.txt", "w") as file:
    for roll in roll_numbers:
        file.write(roll + "||||||0|||student@123|||1\n")

print("Student database created successfully!")
print("Total students:", len(roll_numbers))
print("Saved in: src/data/students.txt")