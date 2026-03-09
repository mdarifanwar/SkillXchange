## Frontend Features

- Modern React UI with reusable components
- Responsive design for mobile and desktop
- Real-time chat using Socket.io
- Google OAuth login
- Toast notifications for actions and errors
- Profile management and skill editing
- Admin dashboard for feedback and reports

## Environment Setup

### Frontend
- Requires Node.js (v16+ recommended)
- Install dependencies: `cd Frontend && npm install`
- Configure `.env` as described above
- Start development server: `npm run dev`

### Backend
- Requires Node.js (v16+ recommended)
- Install dependencies: `cd Backend && npm install`
- Configure `.env` as described above
- Start development server: `npm run dev`

### Docker
- Requires Docker and Docker Compose
- Build and run: `docker-compose up`

## Testing

Manual testing is supported via Postman for backend APIs and browser for frontend. Automated tests can be added in the future.

## Contact

For questions or support, open an issue on GitHub or contact the maintainer at mdarifanwar@gmail.com.
## Project Structure

The project is organized as follows:

```
SkillXchange/
├── Backend/         # Node.js/Express backend
├── Frontend/        # React frontend
├── Dockerfile.backend
├── Dockerfile.frontend
├── .gitignore
├── README.md
├── package.json     # Root package.json (optional)
```

Each subfolder contains its own package.json and .env.example files.

## API Endpoints (Backend)

The backend exposes RESTful endpoints for authentication, chat, feedback, rating, reporting, requests, and user management. Example endpoints:

- `POST /api/auth/login` — User login
- `POST /api/auth/register` — User registration
- `GET /api/user/profile` — Get user profile
- `POST /api/chat/send` — Send chat message
- `POST /api/feedback` — Submit feedback
- `POST /api/rating` — Submit rating
- `POST /api/report` — Report a user or issue

See the code in `Backend/routes/` for full endpoint details.

## User Roles

- **User:** Can connect, chat, give feedback, rate, and report.
- **Admin:** Can view feedback, manage reports, moderate users.

## Contribution Guide

1. Fork the repository and clone your fork.
2. Create a new branch for your feature or bugfix.
3. Commit your changes with clear messages.
4. Push your branch and open a Pull Request.
5. Follow code style and add tests where possible.

## Troubleshooting

- If you see errors about missing environment variables, check your `.env` files.
- If MongoDB fails to connect, verify your URI and network access.
- For OAuth issues, ensure Google Cloud Console is configured correctly.
- For Docker issues, check port conflicts and environment variable setup.

## License

This project is licensed under the ISC License.
# SkillXchange

SkillXchange is a MERN stack web platform designed to facilitate collaborative learning and skill development through peer-to-peer guidance. The platform emphasizes reciprocal knowledge exchange, industrial-grade security features, and user-friendly interfaces to create a dynamic learning environment.

## Motivation

In today's fast-paced world, the acquisition of new skills is essential for personal and professional growth. However, traditional learning methods often lack interaction and dynamism. SkillXchange was created to address this gap by providing a platform where users can learn from each other's experiences in a collaborative and supportive community.

## Features

- `Peers' Connection`:  chat interface enable direct communication after connecting request and acceptance and hands-on guidance.
- `Industrial Security Features`: Utilizes Google OAuth 2.0 authentication and JSON Web Tokens (JWT) verification for database security.
- `Rating and Feedback System`: Users can rate and give feedback on guidance sessions, enhancing credibility and accountability.
- `Responsive Layout`: Ensures optimal usability across various devices for an enhanced learning experience.

## Technologies Used

- `Frontend`: React.js, React Router, Context API, React-Bootstrap, Axios, React-Toastify, Socket.io-client.
- `Backend`: Node.js, Express.js, MongoDB (MongoDB Atlas), Mongoose, Socket.io, JSON Web Token (JWT), Passport.js.
- `Deployment`: Docker and Docker Compose
- `Tools`: Google Cloud Console (OAuth), MongoDB Compass, Postman, Docker, Docker Compose, VSCode, Git, GitHub.

## Screenshots

See the screenshots of the project in the screenshots folder.

## Installation

To run SkillXchange locally, follow these steps:

### Prerequisites

1. For Google OAuth, know how to obtain the Google OAuth credentials and configure the redirect and allowed origins routes in the Google Cloud Console.
2. Know how to obtain the connection link of the MongoDB Atlas database.
3. For Nodemailer, you should know how to obtain the app password.
4. Familiarity with working on Node.js and React projects is required.

### Clone the Repo

```bash
git clone https://github.com/mdarifanwar/SkillXchange.git 
cd SkillXchange
```

### Frontend Setup

```bash
cd Frontend; npm install
```

Create a .env file in the Frontend folder with:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Run frontend

```bash
npm run dev
```

The frontend will be running on `http://localhost:5173`

### Backend Setup

```bash
cd ../Backend; npm install
```

Create a .env file in the Backend folder with:

```env
PORT=8000
CORS_ORIGINS=*
MONGODB_URI=mongodb+srv://<your-username>:<your-password>@cluster0.<your-project>.mongodb.net
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback
JWT_SECRET=<your-jwt-secret>
EMAIL_ID=<your-email-id>
APP_PASSWORD=<your-app-password>
ZEGO_APP_ID=<your-zego-app-id>
ZEGO_SERVER_SECRET=<your-zego-server-secret>
FRONTEND_URL=http://localhost:5173
```

Run backend

```bash
npm run dev
```

The backend will be running on `http://localhost:8000`

### Install and Setup through Docker

Create a docker-compose.yml file in the SkillXchange folder with:

```yml
version: '3'
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - PORT=8000
      - CORS_ORIGINS=*
      - MONGODB_URI=mongodb+srv://<your-username>:<your-password>@cluster0.<your-project>.mongodb.net
      - CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
      - CLOUDINARY_API_KEY=<your-cloudinary-api-key>
      - CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
      - GOOGLE_CLIENT_ID=<your-google-client-id>
      - GOOGLE_CLIENT_SECRET=<your-google-client-secret>
      - GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback
      - JWT_SECRET=<your-jwt-secret>
      - EMAIL_ID=<your-email-id>
      - APP_PASSWORD=<your-app-password>
      - ZEGO_APP_ID=<your-zego-app-id>
      - ZEGO_SERVER_SECRET=<your-zego-server-secret>
      - FRONTEND_URL=http://localhost:5173
    ports:
      - "8000:8000"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
    ports:
      - "5173:5173"
```

Run the docker compose file by using the following command which will run both frontend and backend.

```bash
sudo docker-compose up
```

To remove the docker images use the following command

```bash
sudo docker-compose down --rmi all
```

Now you can run the website on `http://localhost:5173`

### Deployment

You can deploy the backend to [Render](https://render.com/) and the frontend to [Vercel](https://vercel.com/). See their documentation for environment variable setup and build instructions.
