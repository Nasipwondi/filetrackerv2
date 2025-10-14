# File Tracker v2

This is a file tracking application with a Node.js backend and a React frontend.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/)
*   [PostgreSQL](https://www.postgresql.org/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/filetrackerv2.git
    cd filetrackerv2
    ```

2.  **Install backend dependencies:**

    ```bash
    npm install
    ```

3.  **Install frontend dependencies:**

    ```bash
    cd dashboard
    npm install
    cd ..
    ```

4.  **Set up environment variables:**

    Create a `.env` file in the root directory and add the following:

    ```
    DB_USER=your_database_user
    DB_PASSWORD=your_database_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_DATABASE=your_database_name
    SESSION_SECRET=your_session_secret
    ```

    Replace the values with your PostgreSQL credentials and a session secret.

5.  **Create the database:**

    Make sure your PostgreSQL server is running and create a database with the name you specified in the `.env` file. You will also need to create a `users` table.

    ```sql
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
    );
    ```

## Usage

1.  **Start the backend server:**

    ```bash
    npm run dev
    ```

    This will start the server with nodemon, which will automatically restart the server on file changes.

2.  **Start the frontend development server:**

    ```bash
    cd dashboard
    npm start
    ```

    This will start the React development server.

3.  Open your browser and navigate to `http://localhost:3000` to see the application.

## Environment Variables

*   `DB_USER` - Your PostgreSQL username
*   `DB_PASSWORD` - Your PostgreSQL password
*   `DB_HOST` - Your PostgreSQL host
*   `DB_PORT` - Your PostgreSQL port
*   `DB_DATABASE` - The name of your PostgreSQL database
*   `SESSION_SECRET` - A secret for express-session

## Built With

*   [Node.js](https://nodejs.org/)
*   [Express](https://expressjs.com/)
*   [React](https://reactjs.org/)
*   [PostgreSQL](https://www.postgresql.org/)
*   [Passport.js](http://www.passportjs.org/)
*   [EJS](https://ejs.co/)
*   [Tailwind CSS](https://tailwindcss.com/)
