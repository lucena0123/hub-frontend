# BPMN System - Frontend

Modern dashboard interface for the BPMN System built with Next.js 14, TypeScript, and TailwindCSS.

## Features

- **Dashboard**: Real-time statistics and recent processes overview
- **Clients Management**: View and monitor all clients with their contracts and tiers
- **Process Monitoring**: Track all process instances with status, progress, and details
- **Real-time Updates**: Auto-refresh dashboard and processes data
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Date Formatting**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on port 3001

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard page
│   ├── clients/           # Clients page
│   └── processes/         # Processes page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard-specific components
│   └── navigation.tsx    # Main navigation
├── lib/                  # Utilities
│   └── api/             # API client
└── types/               # TypeScript types
```

## Available Pages

### Dashboard (`/`)
- Total clients and active clients stats
- Running processes and pending tasks count
- Completed tasks today
- Recent processes table

### Clients (`/clients`)
- List of all clients
- Client details (name, email, tier, status, budget, contract dates)
- Filterable and sortable table

### Processes (`/processes`)
- All process instances
- Real-time status updates
- Progress tracking
- Priority indicators
- Running and completed counts

## API Integration

The frontend connects to the backend API at `http://localhost:3001` and uses the following endpoints:

- `GET /health` - Health check
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client details
- `GET /api/campaigns` - Get all campaigns
- `GET /api/processes` - Get all process instances
- `GET /api/processes/:id` - Get process details
- `GET /api/tasks` - Get all tasks
- `GET /api/dashboard/stats` - Get dashboard statistics

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

The production build will be optimized and ready for deployment.

## Notes

- The dashboard auto-refreshes every 30 seconds
- Process instances page auto-refreshes every 15 seconds
- Ensure the backend API is running before starting the frontend
- The backend must be accessible at the URL specified in `NEXT_PUBLIC_API_URL`
