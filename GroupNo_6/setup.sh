#!/bin/bash

echo "🎨 Setting up AI Fashion Recommendation System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}==== $1 ====${NC}"
}

# Check prerequisites
print_header "Checking Prerequisites"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
print_status "Node.js found: $(node --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 not found. Please install Python 3.11+ from https://python.org"
    exit 1
fi
print_status "Python found: $(python3 --version)"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    print_status "Docker found: $(docker --version)"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker not found. Manual setup will be used."
    DOCKER_AVAILABLE=false
fi

# Setup environment variables
print_header "Environment Setup"

if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp .env .env.backup 2>/dev/null || true
    print_warning "Please edit .env file with your configuration before proceeding!"
    echo "Press Enter when you've configured .env file..."
    read -p ""
else
    print_status ".env file already exists"
fi

# Create project directories
print_header "Creating Project Structure"

directories=(
    "data/raw"
    "data/processed"
    "data/processed/images"
    "backend/node-api/src/routes"
    "backend/node-api/src/middleware"
    "backend/node-api/logs"
    "backend/fastapi-ai/app/routes"
    "backend/fastapi-ai/app/services"
    "backend/fastapi-ai/logs"
    "frontend/src/components"
    "frontend/src/pages"
    "frontend/src/contexts"
    "frontend/src/utils"
    "frontend/dist"
    "logs"
)

for dir in "${directories[@]}"; do
    mkdir -p "$dir"
    print_status "Created directory: $dir"
done

# Dataset setup
print_header "Dataset Setup"

print_status "Dataset setup instructions:"
echo "1. Go to: https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small"
echo "2. Download the dataset"
echo "3. Extract to data/raw/ directory"
echo "4. For development, mock data will be generated automatically"

# Choose setup method
print_header "Setup Method"

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "Choose setup method:"
    echo "1) Docker (Recommended - Easy setup)"
    echo "2) Manual (Full control)"
    read -p "Enter your choice (1 or 2): " setup_choice
else
    setup_choice=2
fi

if [ "$setup_choice" = "1" ]; then
    # Docker setup
    print_header "Docker Setup"
    
    print_status "Building and starting services with Docker..."
    docker-compose up --build -d
    
    if [ $? -eq 0 ]; then
        print_status "Services started successfully!"
        echo ""
        echo "🎉 Application is running:"
        echo "   Frontend: http://localhost:5173"
        echo "   Node.js API: http://localhost:3001"
        echo "   FastAPI AI: http://localhost:8002"
        echo "   API Docs: http://localhost:8002/docs"
    else
        print_error "Docker setup failed. Please check the logs."
        exit 1
    fi
    
else
    # Manual setup
    print_header "Manual Setup"
    
    # Backend FastAPI setup
    print_status "Setting up FastAPI AI service..."
    cd backend/fastapi-ai
    
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    print_status "Activating virtual environment and installing dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt
    
    print_status "Starting FastAPI service in background..."
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload > logs/fastapi.log 2>&1 &
    FASTAPI_PID=$!
    echo $FASTAPI_PID > fastapi.pid
    cd ../..
    
    # Backend Node.js setup
    print_status "Setting up Node.js API..."
    cd backend/node-api
    
    print_status "Installing Node.js dependencies..."
    npm install
    
    print_status "Starting Node.js service in background..."
    nohup npm run dev > logs/nodejs.log 2>&1 &
    NODE_PID=$!
    echo $NODE_PID > nodejs.pid
    cd ../..
    
    # Frontend setup
    print_status "Setting up React frontend..."
    cd frontend
    
    print_status "Installing frontend dependencies..."
    npm install
    
    print_status "Starting frontend development server..."
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    cd ..
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 10
    
    echo ""
    print_status "Manual setup completed!"
    echo ""
    echo "🎉 Application should be running:"
    echo "   Frontend: http://localhost:5173"
    echo "   Node.js API: http://localhost:3001"
    echo "   FastAPI AI: http://localhost:8002"
    echo "   API Docs: http://localhost:8002/docs"
    
    echo ""
    print_warning "To stop services:"
    echo "   pkill -f 'uvicorn app.main:app'"
    echo "   pkill -f 'npm run dev'"
fi

print_status "Setup completed successfully! 🎉"

echo ""
echo "🚀 Next Steps:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Create an account or use demo credentials"
echo "3. Take the style quiz to get AI recommendations"
echo "4. Explore your personalized fashion suggestions"
echo ""
echo "📖 Documentation: Check README.md for detailed information"
echo "🐛 Issues: Check logs/ directory for troubleshooting"
