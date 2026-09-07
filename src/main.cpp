#include <iostream>
#include <string>
using namespace std;

int main()
{
    int choice;

    while (true)
    {
        cout << "\n--------------------------------------\n";
        cout << "   COLLEGE EVENT REGISTRATION PLATFORM\n";
        cout << "--------------------------------------\n";

        cout << "1. View Events\n";
        cout << "2. Register for Event\n";
        cout << "3. Cancel Registration\n";
        cout << "4. View Registered Events\n";
        cout << "5. Exit\n";

        cout << "\nEnter your choice: ";
        cin >> choice;

        switch (choice)
        {
            case 1:
                cout << "\n--------- Available Events ---------\n";
                cout << "1. Tech Fests\n";
                cout << "2. Coding Competitions\n";
                cout << "3. Cultural Events\n";
                cout << "4. Sports Events\n";
                break;

            case 2:
            {
                int eventChoice;
                string studentName;

                cout << "\n--------- Register for Event ---------\n";
                cout << "1. Tech Fests\n";
                cout << "2. Coding Competitions\n";
                cout << "3. Cultural Events\n";
                cout << "4. Sports Events\n";

                cout << "\nEnter event number: ";
                cin >> eventChoice;

                if (eventChoice < 1 || eventChoice > 4)
                {
                    cout << "Invalid event number.\n";
                    break;
                }

                cout << "Enter student name: ";
                cin >> studentName;

                cout << "\nRegistration successful!\n";
                cout << "Student: " << studentName << endl;

                if (eventChoice == 1)
                    cout << "Event: Tech Fest\n";
                else if (eventChoice == 2)
                    cout << "Event: Coding Competition\n";
                else if (eventChoice == 3)
                    cout << "Event: Cultural Event\n";
                else
                    cout << "Event: Sports Event\n";

                break;
            }

            case 3:
                cout << "\n--------- Cancel Registration ---------\n";
                cout << "Cancellation feature will be added in the next phase.\n";
                break;

            case 4:
                cout << "\n--------- Registered Events ---------\n";
                cout << "Registered event details will be displayed here.\n";
                break;

            case 5:
                cout << "\nThank you for using the platform!\n";
                return 0;

            default:
                cout << "\nInvalid choice. Please try again.\n";
        }
    }
}