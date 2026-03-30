# AI Creative Studio

A comprehensive text enhancement and image generation tool that integrates multiple APIs to provide creative workflows.

## Features

### Text Enhancement Workflow
- **Text Input**: Users provide a text prompt
- **AI Enhancement**: System analyzes and enhances the prompt using OpenAI GPT
- **Approval System**: Enhanced text is shown for user approval
- **Image Generation**: Once approved, generates images using DALL-E 3

### Image Analysis Workflow
- **Image Upload**: Users upload images (local or external)
- **AI Analysis**: System analyzes objects, theme, and style using GPT-4 Vision
- **Variation Generation**: Creates similar images and variations

## Technology Stack

### Frontend
- **React.js** - Modern UI framework
- **Lucide React** - Beautiful icons
- **CSS3** - Modern styling with gradients and animations

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **SQLite** - Database for storing data
- **Multer** - File upload handling

### APIs
- **OpenAI GPT-3.5 Turbo** - Text enhancement
- **OpenAI DALL-E 3** - Image generation
- **OpenAI GPT-4 Vision** - Image analysis

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Pear_Ai
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000

# OpenAI API Key
OPENAI_API_KEY=your_actual_openai_api_key_here

# Database
DATABASE_PATH=./database.sqlite

# Upload settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### 4. Install Frontend Dependencies
```bash
cd ../client
npm install
```

### 5. Start the Application

**Start the Backend Server:**
```bash
cd server
node src/server.js
```

**Start the Frontend Development Server:**
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Text Enhancement
- `POST /api/enhance-text` - Start text enhancement
- `GET /api/text-enhancement/:id` - Get enhancement status
- `POST /api/approve-and-generate` - Approve enhanced text and generate image
- `GET /api/generated-image/:id` - Get generated image status

### Image Analysis
- `POST /api/analyze-image` - Upload and analyze image
- `GET /api/image-analysis/:id` - Get analysis status

### History
- `GET /api/text-enhancements` - Get all text enhancements
- `GET /api/image-analyses` - Get all image analyses

### Health Check
- `GET /api/health` - Application health status

## Usage

### Text Enhancement Workflow
1. Enter your text prompt in the input field
2. Click "Enhance Text" to process
3. Review the enhanced text
4. Click "Generate Image" to create visuals
5. View generated images

### Image Analysis Workflow
1. Click "Image Analysis" tab
2. Upload an image file
3. Wait for AI analysis
4. View analysis results and generated variations

## Database Schema

### text_enhancements
- `id` - Primary key
- `original_text` - User's original text
- `enhanced_text` - AI-enhanced version
- `status` - pending, processing, completed, approved
- `created_at` - Timestamp
- `updated_at` - Timestamp

### image_analyses
- `id` - Primary key
- `filename` - Uploaded image filename
- `analysis_result` - JSON analysis data
- `variations` - JSON array of variation URLs
- `status` - pending, processing, completed, failed
- `created_at` - Timestamp
- `updated_at` - Timestamp

### generated_images
- `id` - Primary key
- `prompt` - Text prompt used
- `image_url` - Generated image URL
- `status` - pending, processing, completed, failed
- `created_at` - Timestamp
- `updated_at` - Timestamp

## API Keys Setup

### OpenAI API
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

## Features in Detail

### Text Enhancement
- **Contextual Enhancement**: Uses GPT-3.5 to understand context and improve prompts
- **Style Guidance**: Adds artistic direction and composition details
- **Image-Ready**: Optimized for image generation models

### Image Analysis
- **Object Detection**: Identifies main objects in images
- **Style Recognition**: Determines artistic style and mood
- **Theme Analysis**: Understands overall theme and context
- **Variation Generation**: Creates multiple artistic interpretations

### User Interface
- **Modern Design**: Clean, gradient-based UI with smooth animations
- **Responsive**: Works on desktop and mobile devices
- **Real-time Updates**: Live status updates during processing
- **History Tracking**: View all past enhancements and analyses

## Error Handling

The application includes comprehensive error handling:
- **API Failures**: Graceful fallbacks when APIs are unavailable
- **File Upload Errors**: Validation for file types and sizes
- **Database Errors**: Proper error logging and user feedback
- **Network Issues**: Clear error messages for connectivity problems

## Security Considerations

- **Input Validation**: All inputs are validated and sanitized
- **File Upload Security**: Restricted file types and size limits
- **API Key Protection**: Environment variables for sensitive data
- **CORS Configuration**: Proper cross-origin resource sharing setup

## Deployment

### Production Deployment
1. Set up production environment variables
2. Use a process manager like PM2 for the backend
3. Build the React frontend for production
4. Configure reverse proxy (nginx) if needed
5. Set up SSL certificates

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
OPENAI_API_KEY=your_production_api_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the README and documentation
2. Review existing issues
3. Create a new issue with detailed information

---

**Note**: This application uses simulated responses when API keys are not configured. Add your OpenAI API key to the `.env` file to enable full AI functionality.
