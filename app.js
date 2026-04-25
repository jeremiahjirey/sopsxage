require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const os = require('os');

const app = express();

const mysqldump = require('mysqldump');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

// Konfigurasi S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	sessionToken: process.env.AWS_SESSION_TOKEN, // Menambahkan session token 
    },
});

// Route untuk backup database
app.get('/backup', async (req, res) => {
    try {
        // Path file backup
        const backupFilePath = path.join(__dirname, 'backup.sql');

        // Membuat file backup database
        await mysqldump({
            connection: {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
            },
            dumpToFile: backupFilePath,
        });

        console.log('Backup database berhasil dibuat.');

        // Membaca file backup
        const fileContent = fs.readFileSync(backupFilePath);

        // Mengunggah file ke S3
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `backup-${Date.now()}.sql`, // Nama file di S3
            Body: fileContent,
        };

        const command = new PutObjectCommand(params);
        const data = await s3.send(command);
        
	console.log('Backup berhasil diunggah ke S3:', data);

        // Menghapus file backup lokal
        fs.unlinkSync(backupFilePath);

        res.send(`Backup berhasil diunggah ke S3.`);
    } catch (error) {
        console.error('Gagal membackup database:', error.message);
        res.status(500).send('Gagal membackup database.');
    }
});


// Fungsi untuk mendapatkan IP lokal
function getLocalIP() {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // Default ke localhost jika tidak ditemukan
}

const serverIP = getLocalIP(); // Ambil IP server

// Middleware untuk menambahkan IP server ke setiap request
app.use((req, res, next) => {
    res.locals.serverIP = serverIP; // Kirim ke semua template EJS
    next();
});


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database');

    // Create table if not exists
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS cars (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            image VARCHAR(255) NOT NULL
        )
    `;
    db.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log('Table "cars" is ready');
    });
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Routes

// Read (List all cars)
app.get('/', (req, res) => {
    const query = 'SELECT * FROM cars';
    db.query(query, (err, results) => {
        if (err) throw err;
        res.render('index', { cars: results });
    });
});

// Create (Add new car)
app.get('/add-car', (req, res) => {
    res.render('add-car');
});

app.post('/add-car', upload.single('image'), (req, res) => {
    const { name, price } = req.body;
    const image = `/uploads/${req.file.filename}`;
    const query = 'INSERT INTO cars (name, price, image) VALUES (?, ?, ?)';
    db.query(query, [name, price, image], (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// Update (Edit car)
app.get('/edit-car/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM cars WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) throw err;
        res.render('edit-car', { car: results[0] });
    });
});

app.post('/edit-car/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, price } = req.body;
    let imageQuery = '';
    const values = [name, price];

    // Check if image is uploaded
    if (req.file) {
        const image = `/uploads/${req.file.filename}`;
        imageQuery = ', image = ?';
        values.push(image);
    }

    values.push(id);
    const query = `UPDATE cars SET name = ?, price = ? ${imageQuery} WHERE id = ?`;
    db.query(query, values, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// Delete (Remove car)
app.get('/delete-car/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM cars WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
