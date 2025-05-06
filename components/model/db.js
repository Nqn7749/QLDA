// db.js
import * as FileSystem from "expo-file-system";

// Database path
const dbPath = FileSystem.documentDirectory + "SDK52Test.db";

// Hàm xóa cơ sở dữ liệu (Delete database)
export const deleteDatabase = async () => {
  try {
    const fileExists = await FileSystem.getInfoAsync(dbPath);
    if (fileExists.exists) {
      await FileSystem.deleteAsync(dbPath);
      console.log("Database deleted successfully");
    }
  } catch (error) {
    console.error("Error deleting database:", error);
  }
};

// Hàm khởi tạo cơ sở dữ liệu (Initialize database)
export const initializeDB = async (db) => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS notesTable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        note TEXT NOT NULL,
        priority TEXT,
        category TEXT,
        completed INTEGER DEFAULT 0,
        image TEXT,
        reminder TEXT
      );


      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#6200ee'
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        task TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        done INTEGER DEFAULT 0,
        FOREIGN KEY (note_id) REFERENCES notesTable(id) ON DELETE CASCADE
        
      );
    `);

    // Thêm cột due_date nếu chưa có
    await db.execAsync(`ALTER TABLE notesTable ADD COLUMN due_date TEXT;`)
      .catch((err) => {
        if (!err.message.includes("duplicate column")) {
          throw err;
        }
        // Nếu lỗi do cột đã tồn tại => bỏ qua
      });

      

    console.log("DB initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};