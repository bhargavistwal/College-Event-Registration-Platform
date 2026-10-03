#ifndef STUDENT_H
#define STUDENT_H

#include <string>
using namespace std;

class Student
{
private:
    string rollNumber;
    string name;
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
        password = studentPassword;
        firstLogin = first;
    }

    string getRollNumber()
    {
        return rollNumber;
    }

    string getName()
    {
        return name;
    }

    int getSemester()
    {
        return semester;
    }

    string getPassword()
    {
        return password;
    }

    bool isFirstLogin()
    {
        return firstLogin;
    }

    bool login(string enteredRollNumber, string enteredPassword)
    {
        if (enteredRollNumber == rollNumber &&
            enteredPassword == password)
        {
            return true;
        }

        return false;
    }

    void setName(string newName)
    {
        name = newName;
    }

    void setSemester(int newSemester)
    {
        semester = newSemester;
    }

    void changePassword(string newPassword)
    {
        password = newPassword;
    }

    void completeFirstLogin()
    {
        firstLogin = false;
    }
};

#endif