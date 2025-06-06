# Chapter Performance Dashboard API

This is the backend API for the Chapter Performance Dashboard, designed to manage and retrieve educational chapter data efficiently. It supports filtering, pagination, caching, rate limiting, and secure admin operations.

## Deployed Site Links

### Render Deployment: https://mathango-backend-nk9s.onrender.com 
### EC2 Deployment: http://13.204.21.239:3000/api/v1/chapters 

## Features

*   **Chapter Management:**
    *   Retrieve a list of chapters with advanced filtering (class, unit, status, subject, chapter name) and pagination.
    *   Retrieve details of a specific chapter by its ID.
    *   Upload chapter data via JSON file or direct JSON input (Admin only).
*   **Performance & Reliability:**
    *   **Caching:** Implements Redis caching for GET requests to significantly improve response times.
    *   **Rate Limiting:** Protects the API from abuse by limiting the number of requests per IP address.
*   **Security:**
    *   **Admin Authentication:** Chapter upload functionality is protected and requires an admin API key.
*   **Data Handling:**
    *   Parses uploaded JSON files and processes chapter data.
    *   Provides detailed feedback on successful and failed chapter uploads, including validation errors.

## Tech Stack

*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (using Mongoose ODM)
*   **Caching & Rate Limiting:** Redis (using ioredis client)
*   **File Uploads:** Multer
*   **Environment Management:** dotenv
*   **Deployment:**
    *   Render [memory: programming.cloud_deployment]
    *   AWS EC2 [memory: programming.cloud_deployment]
    *   PM2 (Process Manager for EC2)

## API Endpoints

A detailed API documentation including all endpoints, request/response formats, and error codes can be found in `API_DOCUMENTATION.md` (or see below for a summary).

### Summary of Endpoints

| Method | Endpoint                      | Description                                    | Authentication |
| :----- | :---------------------------- | :--------------------------------------------- | :------------- |
| GET    | `/api/v1/chapters`            | Fetch all chapters (with filters & pagination) | None           |
| GET    | `/api/v1/chapters/:id`        | Fetch a single chapter by ID                   | None           |
| POST   | `/api/v1/chapters`            | Upload chapter data (JSON file or raw JSON)   | Admin API Key  |

## Getting Started

### Prerequisites

*   Node.js (v18.x or higher recommended)
*   npm (Node Package Manager)
*   MongoDB instance (local or MongoDB Atlas) [memory: programming.database_tools]
*   Redis instance (local or cloud-based like Redis Cloud) [memory: programming.database_tools]
*   Git

### Installation

1.  **Clone the repository:**
    ```
    git clone https://github.com/Abhi-shek26/MathanGo_Backend
    cd MathanGo_Backend
    ```

2.  **Install dependencies:**
    ```
    npm install
    ```

3.  **Set up environment variables:**
    *   Create a `.env` file in the root directory.
    *   Populate it with your configuration (see `.env.example` or the template below) [memory: programming.configuration_management].

    **`.env` Template:**
    ```
    PORT=3000
    NODE_ENV=development

    # MongoDB Connection String
    MONGODB_URI=mongodb+srv://<your_username>:<your_password>@<your_cluster_url>/<your_database_name>?retryWrites=true&w=majority&appName=Cluster0

    # Redis Connection URL
    REDIS_URL=redis://default:<your_redis_password>@<your_redis_host>:<your_redis_port>

    # Admin API Key for protected routes
    ADMIN_API_KEY=your-strong-secret-admin-api-key

    # Rate Limiting Configuration
    RATE_LIMIT_MAX=30
    RATE_LIMIT_WINDOW_MS=60000
    ```
    *   **Important:** Replace placeholder values with your actual credentials and ensure your IP is whitelisted for MongoDB Atlas and your Redis instance is accessible.

### Running the Application

*   **Development Mode (with auto-reload):**
    ```
    npm run dev
    ```
    The server will typically start on `http://localhost:3000` [memory: programming.development_environment].

*   **Production Mode:**
    ```
    npm start
    ```


## Deployment

### Render

1.  Create a new "Web Service" on Render.
2.  Connect your GitHub repository.
3.  Set the "Build Command" to `npm install`.
4.  Set the "Start Command" to `npm start`.
5.  Add all necessary environment variables (from your `.env` file) in the Render dashboard under the "Environment" section.

### AWS EC2

1.  Launch an EC2 instance (e.g., Ubuntu).
2.  Connect to the instance via SSH.
3.  Install Node.js, npm, Git, MongoDB (if hosting locally), and Redis (if hosting locally).
4.  Clone the repository to the EC2 instance.
5.  Navigate to the project directory and run `npm install`.
6.  Create a `.env` file with the production configuration.
7.  Use a process manager like PM2 to run the application:
    ```
    sudo npm install pm2 -g
    pm2 start src/server.js --name "chapter-dashboard-api"
    pm2 startup # To ensure PM2 starts on boot
    pm2 save
    ```
8.  Configure the EC2 Security Group to allow inbound traffic on your application's port (e.g., 3000).
## Recommended video for deplyoment on EC2 :
1. https://youtu.be/-FKQwXtrSSQ?si=YEZXiquI6Sd9X9VP
2. https://youtu.be/57TCFZG08oM?si=6cfUrfl0yx8zqSov

**Secrets to configure in GitHub Repository Settings for EC2 deployment:**
*   `AWS_ACCESS_KEY_ID`
*   `AWS_SECRET_ACCESS_KEY`
*   `EC2_SSH_KEY` (Private key for SSH access to EC2)
*   `EC2_HOST` (Public IP or DNS of your EC2 instance)
*   `EC2_USERNAME` (e.g., `ubuntu`)

## API Key for Admin Operations

Admin operations like uploading chapters require an API key to be sent in the `x-api-key` header. This key is defined in the `ADMIN_API_KEY` environment variable.

## Contribution

Feel free to fork this repository, make improvements, and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the ISC License - see the `LICENSE` file for details (if one is created).

