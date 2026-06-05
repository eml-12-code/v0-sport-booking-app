# v0-sport-booking-app

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_sWuUgIqQro8uq6vd5Nii5nx1R05F)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/eml-12-code/v0-sport-booking-app" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>

# Docker 

# Using Docker Compose (recommended)


```bash
docker-compose down -v 
docker compose up --build
```

# Or using Docker directly

```bash
docker build -t sport-booking-app .
docker run -p 3000:3000 sport-booking-app


# MySQL 


```bash
docker ps
docker exec -it <XXXX> mysql -u root =P 
USE sport_booking;
show tables;  

```

```bash
┌────────────────────────────────────────────────────────┐
│  1. THE DATA MASTER (Parent Container)                 │
│     File: classes-screen.tsx (ClassesScreen)           │
│     • Manages global states (selectedDate, memberId)   │
│     • Connects directly to backend Server Actions      │
└──────────────────────────┬─────────────────────────────┘
                           │  Passes Data Down via Props
                           ▼
┌────────────────────────────────────────────────────────┐
│  2. THE STRUCTURAL GRID (Child / Mid-Level Component)  │
│     File: class-list.tsx (ClassList)                   │
│     • Receives arrays; pure visual wrapper             │
│     • Loops data packets cleanly via .map() entries    │
└──────────────────────────┬─────────────────────────────┘
                           │  Passes Unit Attributes
                           ▼
┌────────────────────────────────────────────────────────┐
│  3. THE INTERACTIVE LEAF (Grandchild Component)        │
│     File: class-card.tsx (ClassCard)                   │
│     • Renders individual interface button layouts      │
│     • Fires user clicks back UP through event chains   │
└────────────────────────────────────────────────────────┘

```

Using Lua script 

```bash

┌────────────────────────┐               ┌────────────────────────┐
│  next-app Container    │               │ redis-cache Container  │
├────────────────────────┤               ├────────────────────────┤
│ 1. Boots up            │               │ 1. Boots up (Empty RAM)│
│ 2. Reads booking.lua   │               │                        │
│ 3. Sends SCRIPT LOAD  ───────────────> │ 2. Stores script in RAM│
│    to Redis            │               │ 3. Returns SHA1 Hash   │
│ 4. Receives SHA1 Hash  │ <─────────────│                        │
└────────────────────────┘               └────────────────────────┘


  
```



```bash
docker compose down -v    
docker compose up --build -d
 
  Expect to see the SHA Hash
  => writing image sha256:59713d9f1ca50f228d225c0430cbbf399f8bca1b4a286bbe5823dd0392f1337b       

docker compose logs -f app 
docker exec -it  v0-sport-booking-app-app-1 sh -c "ls -la /app/lib/lua"

docker exec -it redis-cache redis-cli SCRIPT EXISTS 59713d9f1ca50f228d225c0430cbbf399f8bca1b4a286bbe5823dd0392f1337b 

```

# Redis 

# On-Demand Hydration

When your booking action runs, it checks if the class keys exist in Redis. If they don't, it quickly fetches them from MySQL, saves them to Redis, and then securely fires your Lua script.



# Lua Script

The provided Lua script is a Redis-based atomic booking engine. It manages two main processes: Booking (taking a spot) and Cancellation (freeing a spot, which may trigger a waitlist promotion).
Because it uses Redis EVAL (scripting), the entire logic for each action executes as a single transaction, ensuring data consistency (e.g., preventing two people from taking the last spot simultaneously).
Flow Chart Summary
Below is the logical flow of the bookingEngine.lua script.
1. Pathway A: The "CANCEL" Action
If the action is CANCEL, the script follows this logic:
• Check Booked Status: Is the userId in the bookedSetKey?
• Yes:
1.	Remove user from the bookedSetKey.
2.	Refund tokens to the user (INCRBY user balance).
3.	Check Waitlist (queueListKey):
• If waitlist has people:
• Get the next user.
• Can they afford the class?
• Yes: Move them to bookedSetKey, deduct their tokens, and return success.
• No: Re-add them to the queue and increment available spots (spotsKey).
• If waitlist is empty: Increment available spots.
• No (Not booked):
• Check if the user is in the queueListKey.
• If found, remove them from the queue.
• If not found, return an error.
2. Pathway B: The "BOOK" Action
If the action is BOOK, the script follows this logic:
1.	Validation:
• Does the user have enough tokens? If No, exit with error.
• Is the user already booked? If Yes, exit with error.
2.	Capacity Check:
• Are there spots available (spotsKey > 0)?
• No: Add user to queueListKey and return "WAITING_QUEUE".
• Yes:
1.	Decrement available spots (DECR spotsKey).
2.	Deduct tokens from user.
3.	Add user to bookedSetKey.
4.	Return "CONFIRMED".
