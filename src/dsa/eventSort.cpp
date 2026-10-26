#include <iostream>
#include <string>
#include <algorithm>
#include <vector>
using namespace std;

struct Event
{
    int id;
    string name;
    int availableSeats;
};

void sortEventsByName(vector<Event> &events)
{
    for (int i = 0; i < events.size() - 1; i++)
    {
        for (int j = 0; j < events.size() - i - 1; j++)
        {
            if (events[j].name > events[j + 1].name)
            {
                swap(events[j], events[j + 1]);
            }
        }
    }
}

int main()
{
    vector<Event> events =
    {
        {1, "Tech Fest 2026", 100},
        {2, "Code Hackathon", 50},
        {3, "Cultural Night", 200},
        {4, "Basketball Tournament", 80}
    };

    sortEventsByName(events);

    cout << "Events sorted by name:\n\n";

    for (int i = 0; i < events.size(); i++)
    {
        cout << events[i].id << " - "
             << events[i].name
             << " - Seats: "
             << events[i].availableSeats
             << endl;
    }

    return 0;
}