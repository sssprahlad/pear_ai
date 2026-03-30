const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const APIService = require('./Service/apiService');
const apiService = new APIService();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS text_enhancements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_text TEXT NOT NULL,
      enhanced_text TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        db.run(`CREATE TABLE IF NOT EXISTS image_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      analysis_result TEXT,
      variations TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        db.run(`CREATE TABLE IF NOT EXISTS generated_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt TEXT NOT NULL,
      image_url TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    });
}

app.post('/api/enhance-text', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        db.run(
            'INSERT INTO text_enhancements (original_text, status) VALUES (?, ?)',
            [text, 'processing'],
            function (err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                const enhancementId = this.lastID;

                setTimeout(async () => {
                    try {
                        const enhancedText = await apiService.enhanceText(text);

                        db.run(
                            'UPDATE text_enhancements SET enhanced_text = ?, status = ? WHERE id = ?',
                            [enhancedText, 'completed', enhancementId],
                            function (err) {
                                if (err) {
                                    console.error('Update error:', err);
                                }
                            }
                        );
                    } catch (error) {
                        console.error('Text enhancement error:', error);
                        db.run(
                            'UPDATE text_enhancements SET enhanced_text = ?, status = ? WHERE id = ?',
                            [`Enhancement failed: ${error.message}`, 'failed', enhancementId],
                            function (err) {
                                if (err) {
                                    console.error('Update error:', err);
                                }
                            }
                        );
                    }
                }, 1000);

                res.json({
                    message: 'Text enhancement started',
                    id: enhancementId,
                    status: 'processing'
                });
            }
        );
    } catch (error) {
        console.error('Error enhancing text:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/text-enhancement/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        'SELECT * FROM text_enhancements WHERE id = ?',
        [id],
        (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Text enhancement not found' });
            }

            res.json(row);
        }
    );
});

app.post('/api/approve-and-generate', async (req, res) => {
    try {
        const { enhancementId, enhancedText } = req.body;

        if (!enhancementId || !enhancedText) {
            return res.status(400).json({ error: 'Enhancement ID and enhanced text are required' });
        }

        db.run(
            'UPDATE text_enhancements SET status = ? WHERE id = ?',
            ['approved', enhancementId],
            function (err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                db.run(
                    'INSERT INTO generated_images (prompt, status) VALUES (?, ?)',
                    [enhancedText, 'processing'],
                    function (err) {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({ error: 'Database error' });
                        }

                        const imageId = this.lastID;

                        setTimeout(async () => {
                            try {
                                const imageUrl = await apiService.generateImage(enhancedText);

                                db.run(
                                    'UPDATE generated_images SET image_url = ?, status = ? WHERE id = ?',
                                    [imageUrl, 'completed', imageId],
                                    function (err) {
                                        if (err) {
                                            console.error('Update error:', err);
                                        }
                                    }
                                );
                            } catch (error) {
                                console.error('Image generation error:', error);
                                db.run(
                                    'UPDATE generated_images SET image_url = ?, status = ? WHERE id = ?',
                                    [`https://picsum.photos/seed/${Date.now()}/512/512.jpg`, 'failed', imageId],
                                    function (err) {
                                        if (err) {
                                            console.error('Update error:', err);
                                        }
                                    }
                                );
                            }
                        }, 2000);

                        res.json({
                            message: 'Image generation started',
                            imageId: imageId,
                            status: 'processing'
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/generated-image/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        'SELECT * FROM generated_images WHERE id = ?',
        [id],
        (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Generated image not found' });
            }

            res.json(row);
        }
    );
});

app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const filename = req.file.filename;

        db.run(
            'INSERT INTO image_analyses (filename, status) VALUES (?, ?)',
            [filename, 'processing'],
            function (err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                const analysisId = this.lastID;

                setTimeout(async () => {
                    try {
                        const imagePath = path.join(uploadsDir, filename);
                        const imageBuffer = fs.readFileSync(imagePath);
                        const analysis = await apiService.analyzeImage(imageBuffer);
                        const variations = await apiService.generateImageVariations(analysis);

                        db.run(
                            'UPDATE image_analyses SET analysis_result = ?, variations = ?, status = ? WHERE id = ?',
                            [JSON.stringify(analysis), JSON.stringify(variations), 'completed', analysisId],
                            function (err) {
                                if (err) {
                                    console.error('Update error:', err);
                                }
                            }
                        );
                    } catch (error) {
                        console.error('Image analysis error:', error);
                        const fallbackAnalysis = {
                            objects: ['object1', 'object2'],
                            theme: 'unknown',
                            style: 'unknown',
                            description: `Analysis failed: ${error.message}`
                        };
                        const fallbackVariations = [
                            `https://picsum.photos/seed/${Date.now()}-1/512/512.jpg`,
                            `https://picsum.photos/seed/${Date.now()}-2/512/512.jpg`,
                            `https://picsum.photos/seed/${Date.now()}-3/512/512.jpg`
                        ];

                        db.run(
                            'UPDATE image_analyses SET analysis_result = ?, variations = ?, status = ? WHERE id = ?',
                            [JSON.stringify(fallbackAnalysis), JSON.stringify(fallbackVariations), 'failed', analysisId],
                            function (err) {
                                if (err) {
                                    console.error('Update error:', err);
                                }
                            }
                        );
                    }
                }, 1500);

                res.json({
                    message: 'Image analysis started',
                    id: analysisId,
                    filename: filename,
                    status: 'processing'
                });
            }
        );
    } catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/image-analysis/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        'SELECT * FROM image_analyses WHERE id = ?',
        [id],
        (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Image analysis not found' });
            }

            if (row.analysis_result) {
                row.analysis_result = JSON.parse(row.analysis_result);
            }
            if (row.variations) {
                row.variations = JSON.parse(row.variations);
            }

            res.json(row);
        }
    );
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/text-enhancements', (req, res) => {
    db.all(
        'SELECT * FROM text_enhancements ORDER BY created_at DESC',
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        }
    );
});

app.get('/api/image-analyses', (req, res) => {
    db.all(
        'SELECT * FROM image_analyses ORDER BY created_at DESC',
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            rows.forEach(row => {
                if (row.analysis_result) {
                    row.analysis_result = JSON.parse(row.analysis_result);
                }
                if (row.variations) {
                    row.variations = JSON.parse(row.variations);
                }
            });

            res.json(rows);
        }
    );
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large' });
        }
    }
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});