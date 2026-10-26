#include <iostream>
#include "eventStack.h"
using namespace std;

int main()
{
    EventStack history;

    history.push("Registered for Tech Fest");
    history.push("Registered for Code Hackathon");
    history.push("Cancelled Code Hackathon");

    history.displayStack();

    cout << "\nRemoving latest operation:\n";
    history.pop();

    cout << "\nUpdated operation history:\n";
    history.displayStack();

    return 0;
}