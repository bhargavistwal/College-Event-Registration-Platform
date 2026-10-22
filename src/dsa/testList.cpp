#include <iostream>
#include "eventList.h"
using namespace std;

int main()
{
    EventList events;

    events.addEvent(1, "Tech Fest 2026");
    events.addEvent(2, "Code Hackathon");
    events.addEvent(3, "Cultural Night");

    cout << "\nAll Events:\n";
    events.displayEvents();

    cout << "\nSearching for Event ID 2:\n";
    events.searchEvent(2);

    cout << "\nDeleting Event ID 2:\n";
    events.deleteEvent(2);

    cout << "\nEvents after deletion:\n";
    events.displayEvents();

    return 0;
}