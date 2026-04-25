const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        // Cek apakah tabel `cars` ada, jika tidak maka buat tabelnya
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS cars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price INT NOT NULL,
                image VARCHAR(255) NOT NULL
            )
        `);

        console.log("Tabel 'cars' sudah ada atau berhasil dibuat.");

        // Cek apakah tabel memiliki data
        const [rows] = await connection.execute('SELECT COUNT(*) AS count FROM cars');
        const { count } = rows[0];

        if (count > 0) {
            console.log("Tabel 'cars' sudah memiliki data. Tidak ada data yang ditambahkan.");
        } else {
            // Tambahkan data dummy jika tabel kosong
            const dummyData = [
                { name: 'Avanza', price: 500000, image: '/uploads/avanza.jpg' },
                { name: 'Xenia', price: 400000, image: '/uploads/xenia.jpg' },
                { name: 'Ertiga', price: 650000, image: '/uploads/ertiga.jpg' },
            ];

            const insertQuery = `
                INSERT INTO cars (name, price, image) 
                VALUES (?, ?, ?)
            `;

            for (const car of dummyData) {
                await connection.execute(insertQuery, [car.name, car.price, car.image]);
            }

            console.log('Data dummy berhasil ditambahkan ke tabel "cars".');
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error.message);
    } finally {
        await connection.end();
    }
})();
