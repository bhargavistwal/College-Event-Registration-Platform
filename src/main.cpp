#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>
#include <cctype>
#include "classes/student.h"
#include "classes/event.h"

using namespace std;

vector<string> split(string line)
{
    vector<string> parts;
    string delimiter = "|||";

    size_t position;

    while ((position = line.find(delimiter)) != string::npos)
    {
        parts.push_back(line.substr(0, position));
        line.erase(0, position + delimiter.length());
    }

    parts.push_back(line);

    return parts;
}

string toLower(string text)
{
    for (int i = 0; i < text.length(); i++)
    {
        text[i] = tolower(text[i]);
    }

    return text;
}

int main()
{
    vector<Student> students;
    vector<Event> events;
    vector<int> registeredEvents;

    events.push_back(
        Event(1, "Tech Fest 2026", "Technical",
              "15 October 2026", "Main Auditorium", 200, 100)
    );

    events.push_back(
        Event(2, "Code Hackathon", "Coding",
              "20 October 2026", "Lab 3", 100, 50)
    );

    events.push_back(
        Event(3, "Basketball Tournament", "Sports",
              "25 October 2026", "College Ground", 50, 80)
    );

    events.push_back(
        Event(4, "Cultural Night", "Cultural",
              "30 October 2026", "Open Air Theatre", 150, 200)
    );

    ifstream file("src/data/students.txt");

    if (!file)
    {
        cout << "Could not open student database.\n";
        return 1;
    }

    string line;

    while (getline(file, line))
    {
        vector<string> data = split(line);

        if (data.size() != 5)
            continue;

        string rollNumber = data[0];
        string name = data[1];
        int semester = stoi(data[2]);
        string password = data[3];
        bool firstLogin = (data[4] == "1");

        students.push_back(
            Student(rollNumber, name, semester,
                    password, firstLogin)
        );
    }

    file.close();

    ifstream registrationFile("src/data/registrations.txt");

    vector<pair<string, int>> allRegistrations;

    if (registrationFile)
    {
        while (getline(registrationFile, line))
        {
            vector<string> data = split(line);

            if (data.size() != 2)
                continue;

            string rollNumber = data[0];
            int eventId = stoi(data[1]);

            allRegistrations.push_back(
                {rollNumber, eventId}
            );
        }

        registrationFile.close();
    }

    for (int i = 0; i < allRegistrations.size(); i++)
    {
        for (int j = 0; j < events.size(); j++)
        {
            if (allRegistrations[i].second ==
                events[j].getEventId())
            {
                events[j].registerStudent();
                break;
            }
        }
    }

    cout << "\n=== COLLEGE EVENT REGISTRATION ===\n";

    string enteredRollNumber;
    string enteredPassword;

    cout << "\nRoll Number: ";
    cin >> enteredRollNumber;

    cout << "Password: ";
    cin >> enteredPassword;

    int loggedInStudent = -1;

    for (int i = 0; i < students.size(); i++)
    {
        if (students[i].login(
                enteredRollNumber,
                enteredPassword))
        {
            loggedInStudent = i;
            break;
        }
    }

    if (loggedInStudent == -1)
    {
        cout << "\nInvalid Roll Number or Password.\n";
        return 0;
    }

    Student &student = students[loggedInStudent];

    cout << "\nLogin successful!\n";

    if (student.isFirstLogin())
    {
        string name;
        int semester;
        string newPassword;

        cout << "\nFirst login setup\n";

        cout << "Enter your name: ";
        cin.ignore();
        getline(cin, name);

        cout << "Enter your semester: ";
        cin >> semester;

        cout << "Create a new password: ";
        cin >> newPassword;

        student.setName(name);
        student.setSemester(semester);
        student.changePassword(newPassword);
        student.completeFirstLogin();

        ofstream updateFile("src/data/students.txt");

        for (int i = 0; i < students.size(); i++)
        {
            updateFile << students[i].getRollNumber() << "|||"
                       << students[i].getName() << "|||"
                       << students[i].getSemester() << "|||"
                       << students[i].getPassword() << "|||"
                       << (students[i].isFirstLogin() ? "1" : "0")
                       << "\n";
        }

        updateFile.close();

        cout << "\nProfile created successfully!\n";
    }

    for (int i = 0; i < allRegistrations.size(); i++)
    {
        if (allRegistrations[i].first ==
            student.getRollNumber())
        {
            registeredEvents.push_back(
                allRegistrations[i].second
            );
        }
    }

    cout << "\n--- Student Profile ---\n";
    cout << "Name        : "
         << student.getName() << endl;

    cout << "Semester    : "
         << student.getSemester() << endl;

    cout << "Roll Number : "
         << student.getRollNumber() << endl;

    int choice;

    do
    {
        cout << "\n=== STUDENT MENU ===\n";
        cout << "1. View All Events\n";
        cout << "2. Search Events\n";
        cout << "3. View Event Details\n";
        cout << "4. Register for Event\n";
        cout << "5. Cancel Registration\n";
        cout << "6. My Registrations\n";
        cout << "7. My Profile\n";
        cout << "8. Logout\n";

        cout << "\nEnter choice: ";
        cin >> choice;

        switch (choice)
        {
            case 1:
            {
                cout << "\n=== ALL EVENTS ===\n";

                for (int i = 0; i < events.size(); i++)
                {
                    cout << "\nEvent ID        : "
                         << events[i].getEventId() << endl;

                    cout << "Event Name      : "
                         << events[i].getEventName() << endl;

                    cout << "Category        : "
                         << events[i].getCategory() << endl;

                    cout << "Date            : "
                         << events[i].getDate() << endl;

                    cout << "Venue           : "
                         << events[i].getVenue() << endl;

                    cout << "Registration Fee: Rs. "
                         << events[i].getFee() << endl;

                    cout << "Available Seats : "
                         << events[i].getAvailableSeats()
                         << "/"
                         << events[i].getTotalSeats()
                         << endl;
                }

                break;
            }

            case 2:
            {
                string searchText;

                cout << "\n=== SEARCH EVENTS ===\n";
                cout << "Enter event name or category: ";

                cin.ignore();
                getline(cin, searchText);

                searchText = toLower(searchText);

                bool found = false;

                for (int i = 0; i < events.size(); i++)
                {
                    string eventName =
                        toLower(events[i].getEventName());

                    string category =
                        toLower(events[i].getCategory());

                    if (eventName.find(searchText) != string::npos ||
                        category.find(searchText) != string::npos)
                    {
                        found = true;

                        cout << "\nEvent ID        : "
                             << events[i].getEventId() << endl;

                        cout << "Event Name      : "
                             << events[i].getEventName() << endl;

                        cout << "Category        : "
                             << events[i].getCategory() << endl;

                        cout << "Date            : "
                             << events[i].getDate() << endl;

                        cout << "Venue           : "
                             << events[i].getVenue() << endl;

                        cout << "Registration Fee: Rs. "
                             << events[i].getFee() << endl;

                        cout << "Available Seats : "
                             << events[i].getAvailableSeats()
                             << "/"
                             << events[i].getTotalSeats()
                             << endl;
                    }
                }

                if (!found)
                {
                    cout << "\nNo matching event found.\n";
                }

                break;
            }

            case 3:
            {
                int eventId;

                cout << "\n=== EVENT DETAILS ===\n";
                cout << "Enter Event ID: ";
                cin >> eventId;

                bool found = false;

                for (int i = 0; i < events.size(); i++)
                {
                    if (events[i].getEventId() == eventId)
                    {
                        found = true;

                        cout << "\nEvent ID        : "
                             << events[i].getEventId() << endl;

                        cout << "Event Name      : "
                             << events[i].getEventName() << endl;

                        cout << "Category        : "
                             << events[i].getCategory() << endl;

                        cout << "Date            : "
                             << events[i].getDate() << endl;

                        cout << "Venue           : "
                             << events[i].getVenue() << endl;

                        cout << "Registration Fee: Rs. "
                             << events[i].getFee() << endl;

                        cout << "Available Seats : "
                             << events[i].getAvailableSeats()
                             << "/"
                             << events[i].getTotalSeats()
                             << endl;

                        break;
                    }
                }

                if (!found)
                {
                    cout << "\nInvalid Event ID.\n";
                }

                break;
            }

            case 4:
            {
                int eventId;

                cout << "\n=== REGISTER FOR EVENT ===\n";
                cout << "Enter Event ID: ";
                cin >> eventId;

                bool found = false;
                bool alreadyRegistered = false;

                for (int i = 0; i < registeredEvents.size(); i++)
                {
                    if (registeredEvents[i] == eventId)
                    {
                        alreadyRegistered = true;
                        break;
                    }
                }

                if (alreadyRegistered)
                {
                    cout << "\nYou are already registered "
                         << "for this event.\n";

                    break;
                }

                for (int i = 0; i < events.size(); i++)
                {
                    if (events[i].getEventId() == eventId)
                    {
                        found = true;

                        if (events[i].registerStudent())
                        {
                            registeredEvents.push_back(eventId);

                            allRegistrations.push_back(
                                {student.getRollNumber(), eventId}
                            );

                            ofstream saveFile(
                                "src/data/registrations.txt"
                            );

                            for (int j = 0;
                                 j < allRegistrations.size();
                                 j++)
                            {
                                saveFile
                                    << allRegistrations[j].first
                                    << "|||"
                                    << allRegistrations[j].second
                                    << "\n";
                            }

                            saveFile.close();

                            cout << "\nRegistration successful!\n";

                            cout << "Event: "
                                 << events[i].getEventName()
                                 << endl;

                            cout << "Available Seats: "
                                 << events[i].getAvailableSeats()
                                 << "/"
                                 << events[i].getTotalSeats()
                                 << endl;
                        }
                        else
                        {
                            cout << "\nSorry, no seats are available.\n";
                        }

                        break;
                    }
                }

                if (!found)
                {
                    cout << "\nInvalid Event ID.\n";
                }

                break;
            }

            case 5:
            {
                if (registeredEvents.empty())
                {
                    cout << "\nYou have no registrations to cancel.\n";
                    break;
                }

                cout << "\n=== CANCEL REGISTRATION ===\n";

                int selectedEventId = -1;

                if (registeredEvents.size() == 1)
                {
                    selectedEventId = registeredEvents[0];

                    for (int i = 0; i < events.size(); i++)
                    {
                        if (events[i].getEventId() ==
                            selectedEventId)
                        {
                            cout << "\nYour registration:\n";

                            cout << "Event Name: "
                                 << events[i].getEventName()
                                 << endl;

                            break;
                        }
                    }

                    char confirm;

                    cout << "\nCancel this registration? (Y/N): ";
                    cin >> confirm;

                    if (confirm != 'Y' &&
                        confirm != 'y')
                    {
                        cout << "\nCancellation cancelled.\n";
                        break;
                    }
                }
                else
                {
                    cout << "\nYour registered events:\n";

                    for (int i = 0;
                         i < registeredEvents.size();
                         i++)
                    {
                        for (int j = 0;
                             j < events.size();
                             j++)
                        {
                            if (events[j].getEventId() ==
                                registeredEvents[i])
                            {
                                cout << i + 1 << ". "
                                     << events[j].getEventName()
                                     << endl;
                            }
                        }
                    }

                    int selectedNumber;

                    cout << "\nEnter event number to cancel: ";
                    cin >> selectedNumber;

                    if (selectedNumber < 1 ||
                        selectedNumber >
                        registeredEvents.size())
                    {
                        cout << "\nInvalid choice.\n";
                        break;
                    }

                    selectedEventId =
                        registeredEvents[selectedNumber - 1];
                }

                for (int i = 0; i < events.size(); i++)
                {
                    if (events[i].getEventId() ==
                        selectedEventId)
                    {
                        events[i].cancelRegistration();

                        cout << "\nRegistration cancelled successfully.\n";

                        cout << "Event: "
                             << events[i].getEventName()
                             << endl;

                        break;
                    }
                }

                for (int i = 0;
                     i < registeredEvents.size();
                     i++)
                {
                    if (registeredEvents[i] ==
                        selectedEventId)
                    {
                        registeredEvents.erase(
                            registeredEvents.begin() + i
                        );

                        break;
                    }
                }

                for (int i = 0;
                     i < allRegistrations.size();
                     i++)
                {
                    if (allRegistrations[i].first ==
                            student.getRollNumber() &&
                        allRegistrations[i].second ==
                            selectedEventId)
                    {
                        allRegistrations.erase(
                            allRegistrations.begin() + i
                        );

                        break;
                    }
                }

                ofstream saveFile(
                    "src/data/registrations.txt"
                );

                for (int i = 0;
                     i < allRegistrations.size();
                     i++)
                {
                    saveFile
                        << allRegistrations[i].first
                        << "|||"
                        << allRegistrations[i].second
                        << "\n";
                }

                saveFile.close();

                break;
            }

            case 6:
            {
                cout << "\n=== MY REGISTRATIONS ===\n";

                if (registeredEvents.empty())
                {
                    cout << "\nYou have not registered "
                         << "for any event.\n";

                    break;
                }

                for (int i = 0;
                     i < registeredEvents.size();
                     i++)
                {
                    for (int j = 0;
                         j < events.size();
                         j++)
                    {
                        if (events[j].getEventId() ==
                            registeredEvents[i])
                        {
                            cout << "\nEvent ID   : "
                                 << events[j].getEventId()
                                 << endl;

                            cout << "Event Name : "
                                 << events[j].getEventName()
                                 << endl;

                            cout << "Category   : "
                                 << events[j].getCategory()
                                 << endl;

                            cout << "Date       : "
                                 << events[j].getDate()
                                 << endl;

                            cout << "Venue      : "
                                 << events[j].getVenue()
                                 << endl;

                            cout << "Status     : Registered\n";
                        }
                    }
                }

                break;
            }

            case 7:
            {
                cout << "\n--- My Profile ---\n";

                cout << "Name        : "
                     << student.getName() << endl;

                cout << "Semester    : "
                     << student.getSemester() << endl;

                cout << "Roll Number : "
                     << student.getRollNumber() << endl;

                break;
            }

            case 8:
            {
                cout << "\nLogged out successfully.\n";
                break;
            }

            default:
            {
                cout << "\nInvalid choice.\n";
            }
        }

    } while (choice != 8);

    return 0;
}