
#ifndef EVENT_H
#define EVENT_H

#include <iostream>
#include <string>
using namespace std;

class Event
{
private:
    int eventId;
    string eventName;
    string category;
    string date;
    string venue;
    int fee;
    int totalSeats;
    int availableSeats;
    string parentEvent;
    string eventType;
    bool openAccess;

public:
    Event(int id, string name, string eventCategory,
          string eventDate, string eventVenue,
          int eventFee, int seats,
          string parent = "None",
          string type = "Individual",
          bool open = false)
    {
        eventId = id;
        eventName = name;
        category = eventCategory;
        date = eventDate;
        venue = eventVenue;
        fee = eventFee;
        totalSeats = seats;
        availableSeats = seats;
        parentEvent = parent;
        eventType = type;
        openAccess = open;
    }

    int getEventId() const
    {
        return eventId;
    }

    string getEventName() const
    {
        return eventName;
    }

    string getCategory() const
    {
        return category;
    }

    string getDate() const
    {
        return date;
    }

    string getVenue() const
    {
        return venue;
    }

    int getFee() const
    {
        return fee;
    }

    int getTotalSeats() const
    {
        return totalSeats;
    }

    int getAvailableSeats() const
    {
        return availableSeats;
    }

    string getParentEvent() const
    {
        return parentEvent;
    }

    string getEventType() const
    {
        return eventType;
    }

    bool isOpenAccess() const
    {
        return openAccess;
    }

    void setAvailableSeats(int seats)
    {
        if (seats >= 0 && seats <= totalSeats)
            availableSeats = seats;
    }

    bool registerStudent()
    {
        if (openAccess)
            return false;

        if (availableSeats > 0)
        {
            availableSeats--;
            return true;
        }

        return false;
    }

    void cancelRegistration()
    {
        if (availableSeats < totalSeats)
            availableSeats++;
    }

    void cancelStudent()
    {
        cancelRegistration();
    }

    void display() const
    {
        cout << "\nEvent ID: " << eventId;
        cout << "\nEvent Name: " << eventName;
        cout << "\nCategory: " << category;
        cout << "\nDate: " << date;
        cout << "\nVenue: " << venue;
        cout << "\nFee: " << fee;
        cout << "\nTotal Seats: " << totalSeats;
        cout << "\nAvailable Seats: " << availableSeats << endl;
    }
};

#endif
