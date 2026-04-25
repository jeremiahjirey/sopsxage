# Langkah Deploy di Amazon Linux 2023
## *Install dependency*
```
bash setup.sh
```
atau bisa dengan 
```
npm install --prefix
npm isntall -g pm2
```
## Konfigurasi *environment*
1. Buat file **.env** pada folder aplikasi
2. Tambahkan kebutuhan untuk mengkoneksikan database seperti hostname, user, password, nama database dan AWS credentials seperti berikut :
```java
# Konfigurasi Database Server
DB_HOST=localhost         # Alamat host database (contoh: localhost atau IP server atau DNS)
DB_USER=root              # Nama pengguna database (contoh: root atau admin)
DB_PASSWORD=yourpassword  # Kata sandi database
DB_NAME=rental_cars       # Nama database yang digunakan

# Konfigurasi server
PORT=3000                 # Port tempat aplikasi berjalan

# AWS Credentials
AWS_ACCESS_KEY_ID=your-access-key-id   # Access Key ID AWS
AWS_SECRET_ACCESS_KEY=your-secret-key  # Secret Access Key AWS
AWS_SESSION_TOKEN=your-session-token   # Token sesi AWS (jika menggunakan kredensial sementara)
AWS_REGION=your-region                 # Wilayah AWS (contoh: us-east-1, us-west-2)
AWS_BUCKET_NAME=your-bucket-name       # Nama bucket S3 tempat penyimpanan backup
```
## Menambahkan data *dummy* ke *database*
```
node dummy.js
```
## Menjalankan aplikasi 
```
pm2 start app.js
```
## Ujicoba aplikasi
Buka browser dan masukan IP Address Anda dan portnya seperti berikut: **http://localhost:3000**
