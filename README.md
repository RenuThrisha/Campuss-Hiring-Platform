# Campuss-Hiring-Platform
A full-stack Campus Hiring Platform that streamlines the campus recruitment process with role-based access, job management, application tracking, and placement workflows.
# Campus Hiring Platform

This project is a full-stack campus hiring platform designed to bridge the gap between students, colleges, and recruiters. It provides a centralized environment where students can build their professional profiles, share their experiences, and discover career opportunities. Companies can use the platform to publish job openings, manage applications, and connect with talented candidates from colleges. Colleges can monitor approvals, and support the hiring ecosystem in a structured way.

## What this project does
- Allows students to sign up, log in, and manage their profiles.
- Enables students to share professional experiences and explore available opportunities.
- Gives companies a simple way to publish internships and job openings.
- Helps companies review applicants and track hiring-related activity.
- Lets colleges manage student access and approval workflows.
- Provides a modern web interface built with React and a scalable backend powered by Express and MongoDB.

## Why this project exists
The goal of this platform is to make campus recruitment easier, faster, and more organized. Instead of relying on disconnected communication channels, the system brings hiring-related interactions into one place so students, colleges, and employers can collaborate more effectively.

## Prerequisites
- Node.js 18+
- MongoDB running locally (or a reachable MongoDB URI)
- npm

## Backend setup
1. Open the backend folder.
2. Create a file named .env with:
   ```env
   PORT=5000
   JWT_SECRET=your-strong-random-secret
   MONGODB_URI=mongodb://127.0.0.1:27017/sphp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend:
   ```bash
   npm run dev
   ```

## Frontend setup
1. Open the frontend folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```

## Notes
- Do not commit real secrets or database credentials.
- The backend currently expects a local MongoDB instance on port 27017.
- If you want to use a cloud MongoDB service, replace the MONGODB_URI value.
