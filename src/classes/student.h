#ifndef STUDENT_H
#define STUDENT_H

#include <iostream>
#include <string>
using namespace std;

class Student
{
private:
    string rollNumber;
    string name;
    string course;
    int semester;
    string password;
    bool firstLogin;

public:
    Student(string roll, string studentName, int sem,
            string studentPassword, bool first)
    {
        rollNumber = roll;
        name = studentName;
        semester = sem;
        course = "";

        if (studentPassword.empty() || studentPassword == "0")
        {
            password = "student@123";
            firstLogin = true;
        }
        else
        {
            password = studentPassword;
            firstLogin = first;
        }

        if (name.empty() || semester <= 0)
            firstLogin = true;
    }

    string getRollNumber() const
    {
        return rollNumber;
    }

    string getName() const
    {
        return name;
    }

    string getCourse() const
    {
        return course;
    }

    int getSemester() const
    {
        return semester;
    }

    string getPassword() const
    {
        return password;
    }

    bool isFirstLogin() const
    {
        return firstLogin;
    }

    bool login(string enteredRollNumber,
               string enteredPassword) const
    {
        return enteredRollNumber == rollNumber &&
               enteredPassword == password;
    }

    void setName(string newName)
    {
        name = newName;
    }

    void setCourse(string newCourse)
    {
        course = newCourse;
    }

    void setSemester(int newSemester)
    {
        semester = newSemester;
    }

    void changePassword(string newPassword)
    {
        if (!newPassword.empty())
            password = newPassword;
    }

    void completeFirstLogin()
    {
        firstLogin = false;
    }
};

#endif