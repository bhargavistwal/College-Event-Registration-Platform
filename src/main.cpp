#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <algorithm>
#include <cctype>
#include <limits>
using namespace std;

#include "classes/student.h"
#include "dsa/EventQueue.h"


class Event
{
private:
    int eventId;
    string eventName;
    string category;
    string date;
    string venue;
    int totalSeats;
    int availableSeats;

public:
    Event(int id, string name, string cat, string d,
          string v, int total, int available)
    {
        eventId = id;
        eventName = name;
        category = cat;
        date = d;
        venue = v;
        totalSeats = total;
        availableSeats = available;
    }

    int getEventId() const { return eventId; }
    string getEventName() const { return eventName; }
    string getCategory() const { return category; }
    string getDate() const { return date; }
    string getVenue() const { return venue; }
    int getTotalSeats() const { return totalSeats; }
    int getAvailableSeats() const { return availableSeats; }

    void setAvailableSeats(int seats)
    {
        if (seats >= 0 && seats <= totalSeats)
            availableSeats = seats;
    }

    void registerStudent()
    {
        if (availableSeats > 0)
            availableSeats--;
    }

    void cancelStudent()
    {
        if (availableSeats < totalSeats)
            availableSeats++;
    }

    void display() const
    {
        cout << "\nEvent ID: " << eventId;
        cout << "\nEvent Name: " << eventName;
        cout << "\nCategory: " << category;
        cout << "\nDate: " << date;
        cout << "\nVenue: " << venue;
        cout << "\nTotal Seats: " << totalSeats;
        cout << "\nAvailable Seats: " << availableSeats << endl;
    }
};

vector<Student> students;
vector<Event> eventList;
vector<pair<string, int>> allRegistrations;
vector<EventQueue> waitingQueues;

vector<string> split(string line)
{
    vector<string> parts;
    const string delimiter = "|||";
    size_t pos;

    while ((pos = line.find(delimiter)) != string::npos)
    {
        parts.push_back(line.substr(0, pos));
        line.erase(0, pos + delimiter.length());
    }

    parts.push_back(line);
    return parts;
}

string toLower(string value)
{
    for (char& ch : value)
    {
        ch = static_cast<char>(
            tolower(static_cast<unsigned char>(ch))
        );
    }

    return value;
}

void saveStudents()
{
    ofstream file("src/data/students.txt");

    if (!file)
    {
        cout << "Could not save students.txt.\n";
        return;
    }

    for (const auto& st : students)
    {
        file << st.getRollNumber() << "|||"
             << st.getName() << "|||"
             << st.getSemester() << "|||"
             << st.getPassword() << "|||"
             << (st.isFirstLogin() ? "1" : "0") << '\n';
    }
}

void loadStudents()
{
    ifstream file("src/data/students.txt");

    if (!file)
    {
        cout << "Could not open src/data/students.txt.\n";
        cout << "Run the program from the project root folder.\n";
        return;
    }

    string line;

    while (getline(file, line))
    {
        if (!line.empty() && line.back() == '\r')
            line.pop_back();

        if (line.empty())
            continue;

        vector<string> data = split(line);

        if (data.size() != 5)
        {
            cout << "Skipping invalid student record.\n";
            continue;
        }

        try
        {
            students.emplace_back(
                data[0],
                data[1],
                stoi(data[2]),
                data[3],
                data[4] == "1"
            );
        }
        catch (...)
        {
            cout << "Skipping invalid student record.\n";
        }
    }
}

void loadRegistrations()
{
    ifstream file("src/data/registrations.txt");

    if (!file)
        return;

    string line;

    while (getline(file, line))
    {
        if (!line.empty() && line.back() == '\r')
            line.pop_back();

        if (line.empty())
            continue;

        vector<string> data = split(line);

        if (data.size() != 2)
            continue;

        try
        {
            allRegistrations.push_back({
                data[0], stoi(data[1])
            });
        }
        catch (...)
        {
            cout << "Skipping invalid registration record.\n";
        }
    }
}

void saveRegistrations()
{
    ofstream file("src/data/registrations.txt");

    if (!file)
    {
        cout << "Could not save registrations.txt.\n";
        return;
    }

    for (const auto& record : allRegistrations)
    {
        file << record.first << "|||"
             << record.second << '\n';
    }
}

void saveWaitingQueues()
{
    ofstream file("src/data/waiting_lists.txt");

    if (!file)
    {
        cout << "Could not save waiting_lists.txt.\n";
        return;
    }

    for (size_t i = 0;
         i < eventList.size() && i < waitingQueues.size();
         ++i)
    {
        int eventId = eventList[i].getEventId();

        for (const string& roll : waitingQueues[i].toVector())
            file << roll << "|||" << eventId << '\n';
    }
}

void loadEvents()
{
    eventList.clear();

    eventList.emplace_back(
        1, "Tech Fest 2026", "Technical",
        "15 October 2026", "Main Auditorium", 200, 200
    );

    eventList.emplace_back(
        2, "Code Hackathon", "Coding",
        "20 October 2026", "Lab 3", 100, 100
    );

    eventList.emplace_back(
        3, "Basketball Tournament", "Sports",
        "25 October 2026", "College Ground", 50, 50
    );

    eventList.emplace_back(
        4, "Cultural Night", "Cultural",
        "30 October 2026", "Open Air Theatre", 150, 150
    );

    waitingQueues.clear();

    for (size_t i = 0; i < eventList.size(); i++)
        waitingQueues.emplace_back();

    for (const auto& record : allRegistrations)
    {
        for (auto& ev : eventList)
        {
            if (ev.getEventId() == record.second)
            {
                ev.registerStudent();
                break;
            }
        }
    }
}

bool isRegistered(const string& roll, int eventId);

void loadWaitingQueues()
{
    ifstream file("src/data/waiting_lists.txt");

    if (!file)
        return;

    string line;

    while (getline(file, line))
    {
        if (!line.empty() && line.back() == '\r')
            line.pop_back();

        if (line.empty())
            continue;

        vector<string> data = split(line);

        if (data.size() != 2)
            continue;

        try
        {
            string roll = data[0];
            int eventId = stoi(data[1]);

            if (isRegistered(roll, eventId))
                continue;

            for (size_t i = 0; i < eventList.size(); ++i)
            {
                if (eventList[i].getEventId() == eventId)
                {
                    waitingQueues[i].enqueue(roll, false);
                    break;
                }
            }
        }
        catch (...)
        {
            cout << "Skipping invalid waiting-list record.\n";
        }
    }
}

Event* findEvent(int id)
{
    for (auto& ev : eventList)
    {
        if (ev.getEventId() == id)
            return &ev;
    }

    return nullptr;
}

bool isRegistered(const string& roll, int eventId)
{
    for (const auto& record : allRegistrations)
    {
        if (record.first == roll &&
            record.second == eventId)
            return true;
    }

    return false;
}

Student* login()
{
    string roll, password;

    cout << "\n========== STUDENT LOGIN ==========\n";
    cout << "Enter Roll Number: ";
    cin >> roll;

    cout << "Enter Password: ";
    cin >> password;

    for (auto& st : students)
    {
        if (st.login(roll, password))
        {
            cout << "\nLogin successful!\n";
            return &st;
        }
    }

    cout << "\nInvalid roll number or password.\n";
    return nullptr;
}

bool adminLogin()
{
    string username, password;

    cout << "\n========== ADMIN LOGIN ==========\n";
    cout << "Enter Admin Username: ";
    cin >> username;

    cout << "Enter Admin Password: ";
    cin >> password;

    if (username == "admin" && password == "admin@123")
    {
        cout << "\nAdmin login successful!\n";
        return true;
    }

    cout << "\nInvalid admin username or password.\n";
    return false;
}

void displayAllEvents()
{
    cout << "\n========== ALL EVENTS ==========\n";

    for (const auto& ev : eventList)
        ev.display();
}

void displayAvailableEvents()
{
    cout << "\n========== AVAILABLE EVENTS ==========\n";

    for (const auto& ev : eventList)
    {
        cout << "\nEvent ID: " << ev.getEventId()
             << "\nEvent Name: " << ev.getEventName()
             << "\nCategory: " << ev.getCategory()
             << "\nDate: " << ev.getDate()
             << "\nAvailable Seats: " << ev.getAvailableSeats()
             << "\nWaiting Students: "
             << waitingQueues[
                    static_cast<size_t>(
                        &ev - eventList.data()
                    )
                ].toVector().size()
             << '\n';
    }
}

void searchEvent()
{
    string keyword;

    cout << "\nEnter event name or category to search: ";
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    getline(cin, keyword);

    keyword = toLower(keyword);
    bool found = false;

    for (const auto& ev : eventList)
    {
        if (toLower(ev.getEventName()).find(keyword) != string::npos ||
            toLower(ev.getCategory()).find(keyword) != string::npos)
        {
            ev.display();
            found = true;
        }
    }

    if (!found)
        cout << "No matching event found.\n";
}

void sortEvents()
{
    int choice;

    cout << "\n========== SORT EVENTS ==========\n";
    cout << "1. Sort by Event Name\n";
    cout << "2. Sort by Available Seats (Highest First)\n";
    cout << "Enter your choice: ";
    cin >> choice;

    if (choice == 1)
    {
        sort(eventList.begin(), eventList.end(),
             [](const Event& a, const Event& b)
             {
                 return a.getEventName() < b.getEventName();
             });

        cout << "\nEvents sorted by name.\n";
    }
    else if (choice == 2)
    {
        sort(eventList.begin(), eventList.end(),
             [](const Event& a, const Event& b)
             {
                 return a.getAvailableSeats() >
                        b.getAvailableSeats();
             });

        cout << "\nEvents sorted by available seats.\n";
    }
    else
    {
        cout << "Invalid choice.\n";
        return;
    }

    displayAllEvents();
}

void displayStudentRegistrations(const string& roll)
{
    cout << "\n========== YOUR REGISTRATIONS ==========\n";

    bool found = false;

    for (const auto& record : allRegistrations)
    {
        if (record.first == roll)
        {
            Event* ev = findEvent(record.second);

            if (ev != nullptr)
            {
                ev->display();
                found = true;
            }
        }
    }

    if (!found)
        cout << "You have not registered for any event.\n";
}

void registerEvent(Student& st)
{
    int eventId;

    displayAvailableEvents();

    cout << "\nEnter Event ID to register: ";

    if (!(cin >> eventId))
    {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Invalid input.\n";
        return;
    }

    Event* ev = findEvent(eventId);

    if (ev == nullptr)
    {
        cout << "Invalid event ID.\n";
        return;
    }

    string roll = st.getRollNumber();

    if (isRegistered(roll, eventId))
    {
        cout << "You are already registered for this event.\n";
        return;
    }

    size_t queueIndex = 0;

    for (size_t i = 0; i < eventList.size(); ++i)
    {
        if (eventList[i].getEventId() == eventId)
        {
            queueIndex = i;
            break;
        }
    }

    EventQueue& queue = waitingQueues[queueIndex];

    if (queue.contains(roll))
    {
        cout << "You are already in this event's waiting list.\n";
        return;
    }

    if (ev->getAvailableSeats() > 0 && queue.isEmpty())
    {
        ev->registerStudent();

        allRegistrations.push_back({roll, eventId});

        saveRegistrations();

        cout << "\nRegistration successful!\n";
        cout << "Event: " << ev->getEventName() << '\n';
    }
    else
    {
        cout << "\nNo seat is currently available, or students are already waiting.\n";
        cout << "Would you like to join the waiting list? (1 = Yes, 0 = No): ";

        int choice;

        if (!(cin >> choice))
        {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid input.\n";
            return;
        }

        if (choice == 1)
        {
            if (queue.enqueue(roll))
            {
                saveWaitingQueues();
                cout << "You have been added to the waiting list.\n";
            }
        }
        else
        {
            cout << "Registration cancelled.\n";
        }
    }
}

void cancelRegistration(Student& st)
{
    int eventId;

    cout << "\nEnter Event ID to cancel registration: ";

    if (!(cin >> eventId))
    {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Invalid input.\n";
        return;
    }

    string roll = st.getRollNumber();

    auto it = find_if(
        allRegistrations.begin(),
        allRegistrations.end(),
        [&](const pair<string, int>& record)
        {
            return record.first == roll &&
                   record.second == eventId;
        }
    );

    if (it == allRegistrations.end())
    {
        cout << "You are not registered for this event.\n";
        return;
    }

    Event* ev = findEvent(eventId);

    if (ev == nullptr)
    {
        cout << "Event not found.\n";
        return;
    }

    allRegistrations.erase(it);

    size_t queueIndex = 0;

    for (size_t i = 0; i < eventList.size(); ++i)
    {
        if (eventList[i].getEventId() == eventId)
        {
            queueIndex = i;
            break;
        }
    }

    string nextRoll;
    EventQueue& queue = waitingQueues[queueIndex];

    if (queue.dequeue(nextRoll))
    {
        allRegistrations.push_back({nextRoll, eventId});

        cout << "\nRegistration cancelled successfully.\n";
        cout << "The next student on the waiting list has been registered.\n";
        cout << "Promoted student roll number: " << nextRoll << '\n';
    }
    else
    {
        ev->cancelStudent();

        cout << "\nRegistration cancelled successfully.\n";
        cout << "One seat is now available.\n";
    }

    saveRegistrations();
    saveWaitingQueues();
}

void displayWaitingList()
{
    int eventId;

    cout << "\nEnter Event ID to view its waiting list: ";

    if (!(cin >> eventId))
    {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Invalid input.\n";
        return;
    }

    for (size_t i = 0; i < eventList.size(); ++i)
    {
        if (eventList[i].getEventId() == eventId)
        {
            cout << "\nEvent: " << eventList[i].getEventName() << '\n';
            waitingQueues[i].displayQueue();
            return;
        }
    }

    cout << "Invalid event ID.\n";
}

void displayAllStudents()
{
    cout << "\n========== ALL STUDENTS ==========\n";

    if (students.empty())
    {
        cout << "No student records found.\n";
        return;
    }

    for (const auto& st : students)
    {
        cout << "\nRoll Number: " << st.getRollNumber()
             << "\nName: " << st.getName()
             << "\nSemester: " << st.getSemester()
             << '\n';
    }
}

void displayAllRegistrations()
{
    cout << "\n========== ALL REGISTRATIONS ==========\n";

    if (allRegistrations.empty())
    {
        cout << "No registrations found.\n";
        return;
    }

    for (const auto& record : allRegistrations)
    {
        Event* ev = findEvent(record.second);

        cout << "\nStudent Roll Number: " << record.first;

        if (ev != nullptr)
            cout << "\nEvent: " << ev->getEventName();

        cout << '\n';
    }
}

void changeStudentPassword(Student& st)
{
    string oldPassword, newPassword, confirmPassword;

    cout << "\nEnter current password: ";
    cin >> oldPassword;

    if (oldPassword != st.getPassword())
    {
        cout << "Incorrect current password.\n";
        return;
    }

    cout << "Enter new password: ";
    cin >> newPassword;

    cout << "Confirm new password: ";
    cin >> confirmPassword;

    if (newPassword != confirmPassword)
    {
        cout << "Passwords do not match.\n";
        return;
    }

    if (newPassword.empty())
    {
        cout << "Password cannot be empty.\n";
        return;
    }

    st.changePassword(newPassword);
    st.completeFirstLogin();

    saveStudents();

    cout << "Password changed successfully.\n";
}

void studentMenu(Student& st)
{
    int choice;

    do
    {
        cout << "\n========== STUDENT MENU ==========\n";
        cout << "Welcome, " << st.getName() << '\n';
        cout << "1. View All Events\n";
        cout << "2. View Available Events\n";
        cout << "3. Search Events\n";
        cout << "4. Register for Event\n";
        cout << "5. Cancel Registration\n";
        cout << "6. View My Registrations\n";
        cout << "7. View Waiting List\n";
        cout << "8. Change Password\n";
        cout << "0. Logout\n";
        cout << "Enter your choice: ";

        if (!(cin >> choice))
        {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid input. Please enter a number.\n";
            continue;
        }

        switch (choice)
        {
            case 1:
                displayAllEvents();
                break;

            case 2:
                displayAvailableEvents();
                break;

            case 3:
                searchEvent();
                break;

            case 4:
                registerEvent(st);
                break;

            case 5:
                cancelRegistration(st);
                break;

            case 6:
                displayStudentRegistrations(st.getRollNumber());
                break;

            case 7:
                displayWaitingList();
                break;

            case 8:
                changeStudentPassword(st);
                break;

            case 0:
                cout << "Logging out...\n";
                break;

            default:
                cout << "Invalid choice. Try again.\n";
        }

    } while (choice != 0);
}

void adminMenu()
{
    int choice;

    do
    {
        cout << "\n========== ADMIN MENU ==========\n";
        cout << "1. View All Events\n";
        cout << "2. View Available Events\n";
        cout << "3. View All Students\n";
        cout << "4. View All Registrations\n";
        cout << "5. View Event Waiting List\n";
        cout << "6. Save All Data\n";
        cout << "7. Sort Events\n";
        cout << "0. Logout\n";
        cout << "Enter your choice: ";

        if (!(cin >> choice))
        {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid input. Please enter a number.\n";
            continue;
        }

        switch (choice)
        {
            case 1:
                displayAllEvents();
                break;

            case 2:
                displayAvailableEvents();
                break;

            case 3:
                displayAllStudents();
                break;

            case 4:
                displayAllRegistrations();
                break;

            case 5:
                displayWaitingList();
                break;

            case 6:
                saveStudents();
                saveRegistrations();
                saveWaitingQueues();
                cout << "All data saved successfully.\n";
                break;

            case 7:
                sortEvents();
                break;

            case 0:
                cout << "Admin logging out...\n";
                break;

            default:
                cout << "Invalid choice. Try again.\n";
        }

    } while (choice != 0);
} 

int main()
{
    cout << "========================================\n";
    cout << "   COLLEGE EVENT REGISTRATION PLATFORM\n";
    cout << "========================================\n";

    loadStudents();
    loadRegistrations();
    loadEvents();
    loadWaitingQueues();

    int choice;

    do
    {
        cout << "\n========== MAIN MENU ==========\n";
        cout << "1. Student Login\n";
        cout << "2. Admin Login\n";
        cout << "0. Exit\n";
        cout << "Enter your choice: ";

        if (!(cin >> choice))
        {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid input. Please enter a number.\n";
            continue;
        }

        switch (choice)
        {
            case 1:
            {
                Student* loggedInStudent = login();

                if (loggedInStudent != nullptr)
                    studentMenu(*loggedInStudent);

                break;
            }

            case 2:
                if (adminLogin())
                    adminMenu();

                break;

            case 0:
                saveStudents();
                saveRegistrations();
                saveWaitingQueues();

                cout << "Data saved successfully.\n";
                cout << "Thank you for using the platform!\n";
                break;

            default:
                cout << "Invalid choice. Try again.\n";
        }

    } while (choice != 0);

    return 0;
}
