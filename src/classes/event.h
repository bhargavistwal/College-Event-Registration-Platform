#ifndef EVENTLIST_H
#define EVENTLIST_H

#include <iostream>
#include <string>
using namespace std;

struct EventNode
{
    int eventId;
    string eventName;
    EventNode *next;
};

class EventList
{
private:
    EventNode *head;

public:
    EventList()
    {
        head = nullptr;
    }

    void addEvent(int id, string name)
    {
        EventNode *newNode = new EventNode;

        newNode->eventId = id;
        newNode->eventName = name;
        newNode->next = nullptr;

        if (head == nullptr)
        {
            head = newNode;
            return;
        }

        EventNode *temp = head;

        while (temp->next != nullptr)
        {
            temp = temp->next;
        }

        temp->next = newNode;
    }

    void displayEvents()
    {
        EventNode *temp = head;

        while (temp != nullptr)
        {
            cout << "Event ID: " << temp->eventId << endl;
            cout << "Event Name: " << temp->eventName << endl;
            cout << "-------------------" << endl;

            temp = temp->next;
        }
    }

    ~EventList()
    {
        while (head != nullptr)
        {
            EventNode *temp = head;
            head = head->next;
            delete temp;
        }
    }
};

#endif