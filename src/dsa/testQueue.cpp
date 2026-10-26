#include <iostream>
#include "eventQueue.h"
using namespace std;

int main()
{
    EventQueue waitingList;

    waitingList.enqueue("2028679");
    waitingList.enqueue("2027534");
    waitingList.enqueue("2028123");

    waitingList.displayQueue();

    cout << "\nProcessing waiting list:\n";

    string roll;

    if (waitingList.dequeue(roll))
        cout << "Processed student: " << roll << '\n';

    if (waitingList.dequeue(roll))
        cout << "Processed student: " << roll << '\n';

    cout << "\nRemaining students:\n";
    waitingList.displayQueue();

    return 0;
}