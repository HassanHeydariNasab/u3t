# Ultimate Tic Tac Toe

An online multiplayer Ultimate Tic Tac Toe game built with NestJS backend using GraphQL and SQLite, and SvelteJS frontend.

## Project Structure

```
t3u/
├── backend/           # NestJS backend with GraphQL
│   ├── src/
│   │   ├── auth/      # Authentication module (GraphQL resolvers)
│   │   ├── users/     # User management with TypeORM
│   │   └── config/    # Configuration
│   ├── database.sqlite # SQLite database file
│   └── ...
├── frontend/          # SvelteJS frontend with graphql-request
│   ├── src/
│   │   ├── lib/       # Shared components, stores, and GraphQL
│   │   ├── routes/    # Page routes
│   │   └── ...
│   └── ...
└── README.md
```

## Features

### Current Features (Authentication Setup)

- ✅ User registration and login with GraphQL
- ✅ JWT-based authentication
- ✅ SQLite database with TypeORM
- ✅ GraphQL API with Apollo Server
- ✅ Lightweight GraphQL client with graphql-request
- ✅ Protected routes and queries
- ✅ Responsive UI with modern design
- ✅ Form validation with GraphQL input types
- ✅ Error handling for GraphQL errors
- ✅ GraphQL Playground for API exploration

### Planned Features

- 🔄 Ultimate Tic Tac Toe game logic
- 🔄 Real-time multiplayer with GraphQL Subscriptions
- 🔄 Game rooms and matchmaking
- 🔄 Game history and statistics
- 🔄 Leaderboards

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Set environment variables (create a `.env` file):

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
PORT=3000
```

4. Start the development server:

```bash
npm run start:dev
```

The backend will be available at:

- **API**: `http://localhost:3000`
- **GraphQL Playground**: `http://localhost:3000/graphql`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## GraphQL API

### Queries

- `profile` - Get current user profile (requires authentication)
- `users` - Get all users (requires authentication)
- `user(id: String!)` - Get user by ID (requires authentication)

### Mutations

- `login(loginInput: LoginInput!)` - Login user
- `register(registerInput: RegisterInput!)` - Register new user

### Input Types

```graphql
input LoginInput {
  email: String!
  password: String!
}

input RegisterInput {
  email: String!
  username: String!
  password: String!
}
```

### Object Types

```graphql
type User {
  id: ID!
  email: String!
  username: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type AuthResponse {
  access_token: String!
  user: User!
}
```

## Technology Stack

### Backend

- **NestJS** - Node.js framework
- **GraphQL** - API query language with Apollo Server
- **TypeORM** - Object-relational mapping
- **SQLite** - Embedded database
- **JWT** - Authentication tokens
- **Passport** - Authentication middleware
- **bcrypt** - Password hashing
- **class-validator** - Input validation

### Frontend

- **SvelteJS** - Reactive frontend framework
- **TypeScript** - Type safety
- **graphql-request** - Lightweight GraphQL client
- **js-cookie** - Cookie management

## Development

### Backend Development

```bash
cd backend
npm run start:dev    # Development mode with hot reload
npm run build        # Build for production
npm run start:prod   # Production mode
npm run test         # Run tests
```

### Frontend Development

```bash
cd frontend
npm run dev          # Development mode
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

## Database

The project uses SQLite as the database with TypeORM for object-relational mapping. The database file (`database.sqlite`) is automatically created in the backend directory when you first run the application.

### Database Schema

#### Users Table

- `id` - UUID primary key
- `email` - Unique email address
- `username` - Display name
- `password` - Hashed password
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## GraphQL Development

### Using GraphQL Playground

Visit `http://localhost:3000/graphql` when the backend is running to explore the GraphQL schema and test queries/mutations.

### Example Queries

**Register a new user:**

```graphql
mutation {
  register(
    registerInput: {
      email: "user@example.com"
      username: "testuser"
      password: "password123"
    }
  ) {
    access_token
    user {
      id
      email
      username
    }
  }
}
```

**Login:**

```graphql
mutation {
  login(loginInput: { email: "user@example.com", password: "password123" }) {
    access_token
    user {
      id
      email
      username
    }
  }
}
```

**Get profile (requires Authorization header):**

```graphql
query {
  profile {
    id
    email
    username
    createdAt
    updatedAt
  }
}
```

## Authentication Flow

1. User registers/logs in through the frontend forms
2. GraphQL mutation is sent to the backend using graphql-request
3. Backend validates credentials and returns JWT token
4. Frontend stores token in cookies
5. graphql-request client automatically adds token to Authorization header
6. Backend validates token and allows/denies access to protected queries

## Next Steps

1. Implement Ultimate Tic Tac Toe game logic
2. Add GraphQL subscriptions for real-time gameplay
3. Create game rooms and matchmaking system
4. Add game statistics and history
5. Implement leaderboards
6. Add unit and integration tests
7. Set up CI/CD pipeline
8. Deploy to production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
