# College Event Registration Platform

## About the Project

This is my C++ project for managing college events and student registrations. The main idea is to make it easier for students to view events, register for them, and cancel their registrations when needed.

The project also has an admin section and uses different data structures, such as linked lists, queues, and stacks, to practise the concepts I have learned in C++ and DSA.

## Features

- Students can log in and view available events.
- Students can search for events.
- Students can register for an event or cancel a registration.
- A queue is used to manage the waiting list.
- Admins can log in and sort events by name or available seats.
- Student and registration details can be stored in text files.

## Technologies Used

- C++
- Object-Oriented Programming (OOP)
- Data Structures and Algorithms (DSA)
- File handling

## Project Structure

```text
College-Event-Registration-Platform/
│
├── src/
│   ├── main.cpp
│   ├── classes/
│   │   ├── event.h
│   │   └── student.h
│   ├── dsa/
│   │   ├── eventList.h
│   │   ├── eventQueue.h
│   │   ├── eventSort.cpp
│   │   ├── eventStack.h
│   │   ├── testList.cpp
│   │   ├── testQueue.cpp
│   │   └── testStack.cpp
│   └── data/
│       ├── students.txt
│       ├── registrations.txt
│       └── waiting_lists.txt
│
├── tools/
│   └── generate_students.py
│
├── .gitignore
└── README.md
```

Some files inside the `data` folder are local files and may not be included in the GitHub repository.

## Data Structures Used

**Linked List:** Used in the separate linked-list module to practise working with nodes and event records.

**Queue:** Used for the waiting-list functionality. Students waiting for a seat are handled in FIFO order, meaning the student who joins first gets the seat first.

**Stack:** Included as a separate module to practise stack operations.

**Sorting:** The project includes sorting functionality for arranging events by name or available seats.

## How to Run the Project

You need a C++ compiler that supports C++17.

Open the terminal in the project folder and compile the main program:

```bash
g++ -std=c++17 src/main.cpp -o main.exe
```

Run it in Windows PowerShell:

```powershell
.\main.exe
```

The programs inside `src/dsa` can also be compiled separately when testing their individual operations.

## What I Learned

While working on this project, I got practice with classes and objects, file handling, linked lists, queues, stacks, and sorting. I also learned how to organise a C++ project into different files and use Git and GitHub to track changes.

## Future Improvements

I plan to improve the input validation, test more edge cases, and make the registration and waiting-list handling more reliable as I continue working on the project.