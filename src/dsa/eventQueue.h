#ifndef EVENTQUEUE_H
#define EVENTQUEUE_H

#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct QueueNode
{
    string rollNumber;
    QueueNode *next;
};

class EventQueue
{
private:
    QueueNode *front;
    QueueNode *rear;

    void clear()
    {
        while (front != nullptr)
        {
            QueueNode *temp = front;
            front = front->next;
            delete temp;
        }

        rear = nullptr;
    }

public:
    EventQueue() : front(nullptr), rear(nullptr) {}

    EventQueue(const EventQueue&) = delete;
    EventQueue& operator=(const EventQueue&) = delete;

    EventQueue(EventQueue&& other) noexcept
        : front(other.front), rear(other.rear)
    {
        other.front = nullptr;
        other.rear = nullptr;
    }

    EventQueue& operator=(EventQueue&& other) noexcept
    {
        if (this != &other)
        {
            clear();

            front = other.front;
            rear = other.rear;

            other.front = nullptr;
            other.rear = nullptr;
        }

        return *this;
    }

    bool isEmpty() const
    {
        return front == nullptr;
    }

    bool contains(const string& roll) const
    {
        QueueNode *temp = front;

        while (temp != nullptr)
        {
            if (temp->rollNumber == roll)
                return true;

            temp = temp->next;
        }

        return false;
    }

    bool enqueue(const string& roll, bool showMessage = true)
    {
        if (contains(roll))
        {
            if (showMessage)
                cout << "Student is already in the waiting list.\n";

            return false;
        }

        QueueNode *newNode = new QueueNode{roll, nullptr};

        if (rear == nullptr)
        {
            front = rear = newNode;
        }
        else
        {
            rear->next = newNode;
            rear = newNode;
        }

        if (showMessage)
            cout << "Student added to waiting list.\n";

        return true;
    }

    bool dequeue(string& roll)
    {
        if (isEmpty())
            return false;

        QueueNode *temp = front;

        roll = temp->rollNumber;
        front = front->next;

        if (front == nullptr)
            rear = nullptr;

        delete temp;

        return true;
    }

    vector<string> toVector() const
    {
        vector<string> result;
        QueueNode *temp = front;

        while (temp != nullptr)
        {
            result.push_back(temp->rollNumber);
            temp = temp->next;
        }

        return result;
    }

    void displayQueue() const
    {
        if (isEmpty())
        {
            cout << "Waiting list is empty.\n";
            return;
        }

        cout << "\nWaiting List:\n";

        QueueNode *temp = front;

        while (temp != nullptr)
        {
            cout << temp->rollNumber << '\n';
            temp = temp->next;
        }
    }

    ~EventQueue()
    {
        clear();
    }
};

#endif