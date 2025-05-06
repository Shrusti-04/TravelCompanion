# TravelCompanion

A modern travel planning and management application built with React, Node.js, and PostgreSQL. Plan your trips, manage itineraries, create packing lists, and share your travel plans with friends and family.

## Features

- 📅 **Trip Planning**: Create and manage detailed trip itineraries
- 📝 **Daily Activities**: Organize activities with times, locations, and descriptions
- 📦 **Packing Lists**: Create and manage packing lists for your trips
- 🌤️ **Weather Integration**: Check weather forecasts for your destination
- 🤝 **Trip Sharing**: Share your trip plans with friends and family
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**:

  - React with TypeScript
  - Vite for build tooling
  - TailwindCSS for styling
  - Radix UI components
  - React Query for data fetching

- **Backend**:
  - Node.js with Express
  - TypeScript
  - PostgreSQL database
  - Drizzle ORM for database operations

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository

```powershell
git clone https://github.com/yourusername/TravelCompanion.git
cd TravelCompanion
```

2. Install dependencies

```powershell
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` and other required variables

4. Set up the database

```powershell
npm run db:push
```

5. Start the development server

```powershell
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Development

### Project Structure

- `/client` - Frontend React application

  - `/src/components` - React components
  - `/src/pages` - Page components
  - `/src/hooks` - Custom React hooks
  - `/src/lib` - Utility functions and configurations

- `/server` - Backend Node.js application

  - `/routes` - API route handlers
  - `/migrations` - Database migrations

- `/shared` - Shared TypeScript types and schemas

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Update database schema

## Deployment

The application can be deployed to Render.com:

1. Create a new PostgreSQL database on Render
2. Create a new Web Service for the backend
3. Create a new Static Site for the frontend
4. Configure environment variables
5. Deploy!

Detailed deployment instructions can be found in [DEPLOYMENT.md](DEPLOYMENT.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Radix UI](https://www.radix-ui.com/) for the UI components
- [TailwindCSS](https://tailwindcss.com/) for the styling system
- [Vite](https://vitejs.dev/) for the build tooling
- [Drizzle](https://orm.drizzle.team/) for the database ORM
