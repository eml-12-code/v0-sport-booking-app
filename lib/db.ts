import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'app_user',
  password: process.env.MYSQL_PASSWORD || 'app_password',
  database: process.env.MYSQL_DATABASE || 'sport_booking',
  timezone: '+08:00', 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// INSERT THE CODE RIGHT HERE 
pool.on('connection', (connection: any) => {
  connection.promise().query("SET time_zone = '+08:00';")
    .then(() => console.log("🚀 Connection session synchronized to HKT (+08:00)"))
    .catch((err: any) => console.error("❌ Failed to bind session timezone:", err))
})

export default pool
