#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <algorithm>
#include <cctype>
#include <limits>

using namespace std;

#include "classes/student.h"
#include "classes/event.h"
#include "dsa/EventQueue.h"

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
             << st.getCourse() << "|||"
             << st.getSemester() << "|||"
             << st.getPassword() << "|||"
             << (st.isFirstLogin() ? "1" : "0") << '\n';
    }

    file.close();
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

    students.clear();

    string line;

    while (getline(file, line))
    {
        if (!line.empty() && line.back() == '\r')
            line.pop_back();

        if (line.empty())
            continue;

        vector<string> data = split(line);

        try
        {
            if (data.size() == 6)
            {
                students.emplace_back(
                    data[0],
                    data[1],
                    data[2],
                    stoi(data[3]),
                    data[4],
                    data[5] == "1"
                );
            }
            else if (data.size() == 5)
            {
                students.emplace_back(
                    data[0],
                    data[1],
                    "",
                    stoi(data[2]),
                    data[3],
                    data[4] == "1"
                );
            }
            else
            {
                cout << "Skipping invalid student record.\n";
            }
        }
        catch (...)
        {
            cout << "Skipping invalid student record.\n";
        }
    }

    file.close();

    cout << "Student records loaded: " << students.size() << '\n';
}

void loadRegistrations()
{
    ifstream file("src/data/registrations.txt");

    if (!file)
        return;

    allRegistrations.clear();

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

    file.close();
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

    file.close();
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

    file.close();
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

void loadEvents()
{
    eventList.clear();

    eventList.emplace_back(
        1, "EMERGE", "Orientation",
        "24-26 November 2026", "B.Tech Auditorium",
        0, 0, "None", "Festival", true
    );

    eventList.emplace_back(
        2, "Orientation Workshops", "Academic",
        "24 November 2026", "B.Tech Auditorium",
        0, 100, "EMERGE", "Workshop", false
    );

    eventList.emplace_back(
        3, "Ice Breaking Activities", "Cultural",
        "25 November 2026", "Main Ground",
        0, 200, "EMERGE", "Activity", false
    );

    eventList.emplace_back(
        4, "Graphathon / Graph-E-Thon", "Technical",
        "5-6 December 2026", "Computer Labs",
        0, 0, "None", "Festival", true
    );

    eventList.emplace_back(
        5, "Coding Hackathon", "Coding",
        "5 December 2026", "Computer Lab 3",
        0, 100, "Graphathon", "Competition", false
    );

    eventList.emplace_back(
        6, "AI and ML Innovation Challenge", "Artificial Intelligence",
        "6 December 2026", "Computer Lab 3",
        0, 80, "Graphathon", "Competition", false
    );

    eventList.emplace_back(
        7, "DICCT & AWS Student Community Day", "Technical",
        "15-16 December 2026", "B.Tech Auditorium",
        0, 0, "None", "Festival", true
    );

    eventList.emplace_back(
        8, "DICCT Technical Conference", "Computing",
        "15 December 2026", "B.Tech Auditorium",
        0, 150, "DICCT & AWS Student Community Day",
        "Conference", false
    );

    eventList.emplace_back(
        9, "AWS Cloud Community Sessions", "Cloud Computing",
        "16 December 2026", "B.Tech Auditorium",
        0, 120, "DICCT & AWS Student Community Day",
        "Workshop", false
    );

    eventList.emplace_back(
        10, "Global Village Culinary Fest", "Cultural",
        "21-22 January 2027", "Main Ground",
        0, 0, "None", "Festival", true
    );

    eventList.emplace_back(
        11, "Global Cuisine Showcase", "Culinary",
        "21 January 2027", "Main Ground",
        0, 100, "Global Village Culinary Fest",
        "Competition", false
    );

    eventList.emplace_back(
        12, "International Cultural Showcase", "Cultural",
        "22 January 2027", "Main Ground",
        0, 150, "Global Village Culinary Fest",
        "Performance", false
    );

    eventList.emplace_back(
        13, "Annual Athletics Meet", "Sports",
        "11-17 January 2027", "Main Ground",
        0, 0, "None", "Festival", true
    );

    eventList.emplace_back(
        14, "Arm Wrestling", "Sports",
        "11 January 2027", "Main Ground",
        0, 50, "Annual Athletics Meet",
        "Individual Competition", false
    );

    eventList.emplace_back(
        15, "100m Race", "Athletics",
        "12 January 2027", "Main Ground",
        0, 100, "Annual Athletics Meet",
        "Individual Competition", false
    );

    eventList.emplace_back(
        16, "400m Race", "Athletics",
        "13 January 2027", "Main Ground",
        0, 80, "Annual Athletics Meet",
        "Individual Competition", false
    );

    eventList.emplace_back(
        17, "800m Race", "Athletics",
        "14 January 2027", "Main Ground",
        0, 80, "Annual Athletics Meet",
        "Individual Competition", false
    );

    eventList.emplace_back(
        18, "Shot Put", "Athletics",
        "15 January 2027", "Main Ground",
        0, 50, "Annual Athletics Meet",
        "Individual Competition", false
    );

    eventList.emplace_back(
        19, "Javelin Throw", "Athletics",
        "16 January 2027", "Main Ground",
        0, 50, "Annual Athletics Meet",
        "Individual Competition", false
    );

    eventList.emplace_back(
        20, "Accolade", "Cultural and Technical",
        "10-11 February 2027", "Main Ground",
        0, 0, "None", "Festival", true
    );

    eventList.emplace_back(
        21, "Inter-Club Artistic Performances", "Cultural",
        "10 February 2027", "Main Ground",
        0, 150, "Accolade", "Competition", false
    );

    eventList.emplace_back(
        22, "Inter-Club Technical Showcase", "Technical",
        "11 February 2027", "B.Tech Auditorium",
        0, 100, "Accolade", "Exhibition", false
    );

    eventList.emplace_back(
        23, "Psych Express", "Psychology",
        "3-5 March 2027", "CSIT Auditorium",
        0, 0, "None", "Festival", true
    );

    eventList.emplace_back(
        24, "Interactive Psychology Booths", "Psychology",
        "3 March 2027", "CSIT Auditorium",
        0, 100, "Psych Express", "Activity", false
    );

    eventList.emplace_back(
        25, "Psychology Interactive Activities", "Psychology",
        "4 March 2027", "CSIT Auditorium",
        0, 100, "Psych Express", "Activity", false
    );

    eventList.emplace_back(
        26, "Cultural Performances", "Cultural",
        "5 March 2027", "CSIT Auditorium",
        0, 150, "Psych Express", "Performance", false
    );

    eventList.emplace_back(
        27, "BIOCOM & Academic Conferences", "Academic",
        "18-21 March 2027", "B.Tech Auditorium",
        0, 0, "None", "Festival", true
    );

    eventList.emplace_back(
        28, "Computational Biology Symposium", "Biology",
        "18 March 2027", "B.Tech Auditorium",
        0, 120, "BIOCOM & Academic Conferences",
        "Conference", false
    );

    eventList.emplace_back(
        29, "Sustainable Food Ecosystems Conference", "Research",
        "19 March 2027", "B.Tech Auditorium",
        0, 120, "BIOCOM & Academic Conferences",
        "Conference", false
    );

    eventList.emplace_back(
        30, "AI and Data Science Conference", "Artificial Intelligence",
        "20 March 2027", "B.Tech Auditorium",
        0, 150, "BIOCOM & Academic Conferences",
        "Conference", false
    );

    eventList.emplace_back(
        31, "Microbiology Conference", "Biology",
        "21 March 2027", "B.Tech Auditorium",
        0, 120, "BIOCOM & Academic Conferences",
        "Conference", false
    );

    eventList.emplace_back(
        32, "GRAFEST 2027", "Tech and Cultural",
        "15-18 April 2027", "Main Ground",
        0, 0, "None", "Festival", true
    );

    eventList.emplace_back(
        33, "Grafest Opening Ceremony", "Ceremony",
        "15 April 2027", "Main Ground",
        0, 0, "GRAFEST 2027", "Open Access", true
    );

    eventList.emplace_back(
        34, "Coding Hackathon", "Coding",
        "15 April 2027", "B.Tech Auditorium",
        0, 100, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        35, "Capture The Flag (CTF)", "Cybersecurity",
        "15 April 2027", "Computer Labs",
        0, 80, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        36, "AI and ML Model Competition", "Artificial Intelligence",
        "15 April 2027", "Computer Labs",
        0, 80, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        37, "Robotics Competition", "Robotics",
        "15 April 2027", "B.Tech Auditorium",
        0, 60, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        38, "Working Prototype Exhibition", "Engineering",
        "15 April 2027", "B.Tech Auditorium",
        0, 100, "GRAFEST 2027", "Exhibition", false
    );

    eventList.emplace_back(
        39, "Bridge Design Competition", "Civil Engineering",
        "15 April 2027", "B.Tech Auditorium",
        0, 50, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        40, "Technical Workshops and Seminars", "Technical",
        "15 April 2027", "B.Tech Auditorium",
        0, 100, "GRAFEST 2027", "Workshop", false
    );

    eventList.emplace_back(
        41, "Reverse Shark Tank", "Entrepreneurship",
        "16 April 2027", "B.Tech Auditorium",
        0, 50, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        42, "Business Trivia", "Management",
        "16 April 2027", "B.Tech Auditorium",
        0, 80, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        43, "Corporate Quiz", "Management",
        "16 April 2027", "B.Tech Auditorium",
        0, 80, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        44, "Parliamentary Debate", "Literary",
        "16 April 2027", "B.Tech Auditorium",
        0, 50, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        45, "Speech Competition", "Literary",
        "16 April 2027", "B.Tech Auditorium",
        0, 50, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        46, "Essay Writing Competition", "Literary",
        "16 April 2027", "B.Tech Auditorium",
        0, 60, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        47, "General Quiz", "Literary",
        "16 April 2027", "B.Tech Auditorium",
        0, 80, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        48, "Chef Competition", "Culinary",
        "16 April 2027", "Main Ground",
        0, 50, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        49, "Food and Eco-Packaging Showcase", "Management",
        "16 April 2027", "Main Ground",
        0, 80, "GRAFEST 2027", "Exhibition", false
    );

    eventList.emplace_back(
        50, "Solo Dance", "Cultural",
        "16 April 2027", "CSIT Auditorium",
        0, 50, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        51, "Group Dance", "Cultural",
        "16 April 2027", "CSIT Auditorium",
        0, 50, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        52, "Live Band Showcase", "Music",
        "16 April 2027", "Main Ground",
        0, 50, "GRAFEST 2027", "Performance", false
    );

    eventList.emplace_back(
        53, "Solo Instrumental", "Music",
        "16 April 2027", "CSIT Auditorium",
        0, 50, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        54, "Nukkad Natak", "Performing Arts",
        "16 April 2027", "Main Ground",
        0, 50, "GRAFEST 2027", "Performance", false
    );

    eventList.emplace_back(
        55, "Painting Competition", "Fine Arts",
        "16 April 2027", "CSIT Auditorium",
        0, 60, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        56, "Photography Competition", "Fine Arts",
        "16 April 2027", "CSIT Auditorium",
        0, 60, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        57, "E-Sports Competition", "Gaming",
        "16 April 2027", "B.Tech Auditorium",
        0, 100, "GRAFEST 2027", "Competition", false
    );

    eventList.emplace_back(
        58, "Grafest DJ Night", "Entertainment",
        "17 April 2027", "Main Ground",
        0, 0, "GRAFEST 2027", "Open Access", true
    );

    eventList.emplace_back(
        59, "Grafest Celebrity Night", "Entertainment",
        "18 April 2027", "Main Ground",
        0, 0, "GRAFEST 2027", "Open Access", true
    );

    waitingQueues.clear();

    for (size_t i = 0; i < eventList.size(); i++)
    {
        waitingQueues.emplace_back();
    }

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
                    if (!waitingQueues[i].contains(roll))
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

    file.close();
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

void completeStudentProfile(Student& st)
{
    if (!st.isFirstLogin())
        return;

    string name, course;
    int semester;

    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    cout << "\n===== COMPLETE YOUR STUDENT PROFILE =====\n";

    cout << "Enter your full name: ";
    getline(cin, name);

    while (name.empty())
    {
        cout << "Name cannot be empty. Enter again: ";
        getline(cin, name);
    }

    cout << "Enter your course: ";
    getline(cin, course);

    while (course.empty())
    {
        cout << "Course cannot be empty. Enter again: ";
        getline(cin, course);
    }

    cout << "Enter your semester: ";

    while (!(cin >> semester) || semester < 1 || semester > 8)
    {
        cout << "Enter a valid semester (1-8): ";

        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }

    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    st.setName(name);
    st.setCourse(course);
    st.setSemester(semester);
    st.completeFirstLogin();

    saveStudents();

    cout << "\nProfile completed successfully!\n";
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

    for (size_t i = 0; i < eventList.size(); ++i)
    {
        cout << "\nEvent ID: " << eventList[i].getEventId()
             << "\nEvent Name: " << eventList[i].getEventName()
             << "\nCategory: " << eventList[i].getCategory()
             << "\nDate: " << eventList[i].getDate()
             << "\nAvailable Seats: "
             << eventList[i].getAvailableSeats()
             << "\nWaiting Students: "
             << waitingQueues[i].toVector().size()
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

    if (!(cin >> choice))
    {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Invalid input.\n";
        return;
    }

    vector<Event> sortedEvents = eventList;

    if (choice == 1)
    {
        sort(sortedEvents.begin(), sortedEvents.end(),
             [](const Event& a, const Event& b)
             {
                 return a.getEventName() < b.getEventName();
             });

        cout << "\nEvents sorted by name.\n";
    }
    else if (choice == 2)
    {
        sort(sortedEvents.begin(), sortedEvents.end(),
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

    for (const auto& ev : sortedEvents)
        ev.display();
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

    if (ev->isOpenAccess())
    {
        cout << "This event is open access. Registration is not required.\n";
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
        if (ev->registerStudent())
        {
            allRegistrations.push_back({roll, eventId});

            saveRegistrations();

            cout << "\nRegistration successful!\n";
            cout << "Event: " << ev->getEventName() << '\n';
        }
        else
        {
            cout << "Registration could not be completed.\n";
        }
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
        else if (choice == 0)
        {
            cout << "Registration cancelled.\n";
        }
        else
        {
            cout << "Invalid choice.\n";
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
             << "\nCourse: " << st.getCourse()
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

    saveStudents();

    cout << "Password changed successfully.\n";
}

void studentMenu(Student& st)
{
    completeStudentProfile(st);

    int choice;

    do
    {
        choice = -1;

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
        choice = -1;

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
                cout << "Save operation completed. Check for file errors above.\n";
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
        choice = -1;

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

                cout << "Data saved.\n";
                cout << "Thank you for using the platform!\n";
                break;

            default:
                cout << "Invalid choice. Try again.\n";
        }

    } while (choice != 0);

    return 0;
}