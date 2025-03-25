# Letter Writer Web Application

A full-stack web application that allows users to create, edit, and save letters to their Google Drive using Google authentication.

## Project Structure

```
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Redux store configuration
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static files
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
│
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── middleware/     # Custom middleware
│   ├── package.json        # Backend dependencies
│   └── tsconfig.json       # TypeScript configuration
│
└── README.md               # Project documentation
```

## Technology Stack

### Frontend
- React with TypeScript
- Material-UI for components
- Redux Toolkit for state management
- React Query for API data fetching
- React Router for navigation
- Google OAuth 2.0 for authentication

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with Prisma ORM
- JWT for authentication
- Google Drive API integration
- Google OAuth 2.0

## Setup Instructions

1. Clone the repository
2. Set up environment variables:
   - Create `.env` files in both frontend and backend directories
   - Copy the contents from `.env.example` files
   - Add your Google OAuth credentials and other required environment variables

3. Frontend Setup:
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. Backend Setup:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/letter_writer
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Features

- Google OAuth authentication
- Text editor for letter creation and editing
- Save letters to Google Drive
- Draft management
- User-friendly interface
- Secure session management

## Development Guidelines

1. Follow TypeScript best practices
2. Use ESLint and Prettier for code formatting
3. Write unit tests for critical functionality
4. Follow Git flow for version control
5. Document API endpoints and components

## Deployment

The application can be deployed to various cloud platforms:
- Frontend: Netlify/Vercel
- Backend: Heroku/AWS
- Database: AWS RDS/Heroku Postgres

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 