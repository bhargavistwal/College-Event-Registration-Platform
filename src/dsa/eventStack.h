#ifndef EVENTSTACK_H
#define EVENTSTACK_H

#include <iostream>
#include <string>
using namespace std;

struct StackNode
{
    string operation;
    StackNode *next;
};

class EventStack
{
private:
    StackNode *top;

public:
    EventStack()
    {
        top = nullptr;
    }

    bool isEmpty()
    {
        return top == nullptr;
    }

    void push(string action)
    {
        StackNode *newNode = new StackNode;

        newNode->operation = action;
        newNode->next = top;
        top = newNode;

        cout << "Operation saved.\n";
    }

    void pop()
    {
        if (isEmpty())
        {
            cout << "No operations to remove.\n";
            return;
        }

        StackNode *temp = top;

        cout << "Latest operation: "
             << temp->operation << endl;

        top = top->next;
        delete temp;
    }

    void displayStack()
    {
        if (isEmpty())
        {
            cout << "No operations recorded.\n";
            return;
        }

        StackNode *temp = top;

        cout << "\nRecent operations (latest first):\n";

        while (temp != nullptr)
        {
            cout << temp->operation << endl;
            temp = temp->next;
        }
    }

    ~EventStack()
    {
        while (top != nullptr)
        {
            StackNode *temp = top;
            top = top->next;
            delete temp;
        }
    }
};

#endif