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
        if (head == nullptr)
        {
            cout << "Event list is empty." << endl;
            return;
        }

        EventNode *temp = head;

        while (temp != nullptr)
        {
            cout << "Event ID: " << temp->eventId << endl;
            cout << "Event Name: " << temp->eventName << endl;
            cout << "-------------------" << endl;

            temp = temp->next;
        }
    }

    void searchEvent(int id)
    {
        EventNode *temp = head;

        while (temp != nullptr)
        {
            if (temp->eventId == id)
            {
                cout << "Event Found!" << endl;
                cout << "Event ID: " << temp->eventId << endl;
                cout << "Event Name: " << temp->eventName << endl;
                return;
            }

            temp = temp->next;
        }

        cout << "Event not found." << endl;
    }

    void deleteEvent(int id)
    {
        if (head == nullptr)
        {
            cout << "Event list is empty." << endl;
            return;
        }

        if (head->eventId == id)
        {
            EventNode *temp = head;
            head = head->next;
            delete temp;

            cout << "Event deleted successfully." << endl;
            return;
        }

        EventNode *temp = head;

        while (temp->next != nullptr &&
               temp->next->eventId != id)
        {
            temp = temp->next;
        }

        if (temp->next == nullptr)
        {
            cout << "Event not found." << endl;
            return;
        }

        EventNode *nodeToDelete = temp->next;
        temp->next = nodeToDelete->next;

        delete nodeToDelete;

        cout << "Event deleted successfully." << endl;
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