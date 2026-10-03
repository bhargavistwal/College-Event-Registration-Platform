#ifndef EVENT_H
#define EVENT_H

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

public:

    Event(int id, string name, string eventCategory,
          string eventDate, string eventVenue,
          int eventFee, int seats)
    {
        eventId = id;
        eventName = name;
        category = eventCategory;
        date = eventDate;
        venue = eventVenue;
        fee = eventFee;
        totalSeats = seats;
        availableSeats = seats;
    }

    int getEventId()
    {
        return eventId;
    }

    string getEventName()
    {
        return eventName;
    }

    string getCategory()
    {
        return category;
    }

    string getDate()
    {
        return date;
    }

    string getVenue()
    {
        return venue;
    }

    int getFee()
    {
        return fee;
    }

    int getTotalSeats()
    {
        return totalSeats;
    }

    int getAvailableSeats()
    {
        return availableSeats;
    }

    bool registerStudent()
    {
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
        {
            availableSeats++;
        }
    }
};

#endif