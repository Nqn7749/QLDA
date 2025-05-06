import React, { useEffect } from "react";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { initializeDB, deleteDatabase } from "./components/model/db";
import Navigation from "./components/Backend/AppNavigator";

// Sửa DBInitializer để kiểm tra xem có cần xóa DB hay không
function DBInitializer() {
  const db = useSQLiteContext();

  useEffect(() => {
    const setup = async () => {
      const isDebug = false;  // Chỉ bật khi test, hoặc thêm tùy chọn
      if (isDebug) {
        await deleteDatabase();  // Xóa DB khi cần
      }

      // Khởi tạo DB nếu chưa tồn tại
      await initializeDB(db);
    };
    setup();
  }, []);

  return <Navigation />;
}

export default function App() {
  return (
    <SQLiteProvider databaseName="SDK52Test.db">
      <DBInitializer />
    </SQLiteProvider>
  );
}
