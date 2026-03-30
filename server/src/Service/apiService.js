const OpenAI = require('openai');

class APIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async enhanceText(text) {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        return `Enhanced version: ${text} (This is a simulated enhancement. Add your OpenAI API key to .env file for real AI enhancement)`;
      }

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a text enhancement specialist. Improve the given text to make it more descriptive, vivid, and suitable for image generation. Add details about lighting, mood, composition, and artistic style while maintaining the original intent."
          },
          {
            role: "user",
            content: `Enhance this text for image generation: ${text}`
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API error:', error);
      return `Enhanced version: ${text} (API error occurred, using fallback)`;
    }
  }

  async generateImage(prompt) {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        return `https://picsum.photos/seed/${Date.now()}/512/512.jpg`;
      }

      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return response.data[0].url;
    } catch (error) {
      console.error('DALL-E API error:', error);
      return `https://picsum.photos/seed/${Date.now()}/512/512.jpg`;
    }
  }

  async analyzeImage(imageBuffer) {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        return {
          objects: ['object1', 'object2', 'object3'],
          theme: 'nature',
          style: 'realistic',
          description: 'This is a simulated image analysis. Add your OpenAI API key to .env file for real AI vision analysis.'
        };
      }

      const base64Image = imageBuffer.toString('base64');

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and provide: 1) Main objects visible, 2) Overall theme, 3) Artistic style, 4) Detailed description. Format as JSON with keys: objects, theme, style, description."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      });

      const analysisText = response.choices[0].message.content;

      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        return {
          objects: ['various objects'],
          theme: 'general',
          style: 'mixed',
          description: analysisText
        };
      }
    } catch (error) {
      console.error('Vision API error:', error);
      return {
        objects: ['object1', 'object2'],
        theme: 'unknown',
        style: 'unknown',
        description: 'Analysis failed. This is a fallback result.'
      };
    }
  }

  async generateImageVariations(analysis) {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        return [
          `https://picsum.photos/seed/${Date.now()}-1/512/512.jpg`,
          `https://picsum.photos/seed/${Date.now()}-2/512/512.jpg`,
          `https://picsum.photos/seed/${Date.now()}-3/512/512.jpg`
        ];
      }

      const prompt = `Create variations of an image with these characteristics: Objects: ${analysis.objects.join(', ')}, Theme: ${analysis.theme}, Style: ${analysis.style}. Generate different compositions and perspectives.`;

      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 3,
        size: "512x512",
        quality: "standard",
      });

      return response.data.map(img => img.url);
    } catch (error) {
      console.error('Image variation generation error:', error);
      return [
        `https://picsum.photos/seed/${Date.now()}-1/512/512.jpg`,
        `https://picsum.photos/seed/${Date.now()}-2/512/512.jpg`,
        `https://picsum.photos/seed/${Date.now()}-3/512/512.jpg`
      ];
    }
  }
}

module.exports = APIService;
