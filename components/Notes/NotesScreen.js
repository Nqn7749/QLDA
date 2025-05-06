import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  StatusBar,
  Image,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";

export default function Notes() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <NoteList />
    </SafeAreaView>
  );
}

function NoteList() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState({}); // State để lưu trữ tasks theo từng ghi chú

  // Hàm lấy tất cả ghi chú với bộ lọc
  const fetchNotes = async () => {
    const filters = [];
    const params = [];
    let query = "SELECT * FROM notesTable WHERE completed = 0";

    if (selectedCategory) {
      filters.push("category = ?");
      params.push(selectedCategory);
    }

    if (selectedPriority) {
      filters.push("priority = ?");
      params.push(selectedPriority);
    }

    if (searchQuery.trim()) {
      filters.push("(title LIKE ? OR note LIKE ?)");
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    if (filters.length > 0) {
      query += " AND " + filters.join(" AND ");
    }

    query += " ORDER BY date DESC";

    try {
      const result = await db.getAllAsync(query, params);
      console.log("Fetched notes:", result); // Debug log to check fetched notes
      setNotes(result);
    } catch (error) {
      console.error("Error fetching notes:", error);
      Alert.alert("Error", "Could not fetch notes");
    }
  };

  // Hàm lấy danh mục
  const fetchCategories = async () => {
    try {
      const result = await db.getAllAsync("SELECT * FROM categories ORDER BY name");
      setCategories(result);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Hàm lấy tasks của từng ghi chú
  const fetchTasks = async (noteId) => {
    try {
      const result = await db.getAllAsync("SELECT * FROM tasks WHERE note_id = ?", [noteId]);
      console.log("Fetched tasks:", result);
      return result || []; // Trả về một mảng rỗng nếu không có task
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  };

  // Hook useEffect để tải dữ liệu khi màn hình được focus
  useEffect(() => {
    if (isFocused) {
      fetchNotes();
      fetchCategories();
    }
  }, [isFocused, selectedCategory, selectedPriority, searchQuery]);

  // Hook useEffect để cập nhật tasks cho mỗi ghi chú
  useEffect(() => {
    const updateTasks = async () => {
      const tasksMap = {};
      for (let note of notes) {
        const noteTasks = await fetchTasks(note.id);
        tasksMap[note.id] = noteTasks;
      }
      setTasks(tasksMap);
    };

    if (notes.length > 0) {
      updateTasks();
    }
  }, [notes]);

  // Hàm toggle trạng thái hoàn thành của ghi chú
  const toggleCompletion = async (id, currentStatus) => {
    try {
      await db.runAsync("UPDATE notesTable SET completed = ? WHERE id = ?", [!currentStatus, id]);
      fetchNotes();
    } catch (error) {
      console.error("Error updating note completion:", error);
      Alert.alert("Error", "Could not update note status");
    }
  };

  // Hàm toggle trạng thái hoàn thành của task
  const toggleTaskCompletion = async (taskId, noteId, currentStatus) => {
    try {
      // Cập nhật trạng thái task trong database
      await db.runAsync("UPDATE tasks SET completed = ? WHERE id = ?", [!currentStatus, taskId]);

      // Cập nhật lại tasks trong state để hiển thị lại
      const updatedTasks = { ...tasks };
      const noteTasks = updatedTasks[noteId] || [];
      const taskIndex = noteTasks.findIndex((task) => task.id === taskId);
      if (taskIndex >= 0) {
        noteTasks[taskIndex].completed = !currentStatus;
      }
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error toggling task completion:", error);
      Alert.alert("Error", "Could not update task completion status");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Tháng từ 0-11, phải cộng 1
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
  
    return `${month}-${day}-${year} ${hours}:${minutes}`;
  };
  
  // Điều hướng tới màn hình chi tiết ghi chú
  const viewNote = (id) => navigation.navigate("ViewNote", { id });

  // Xóa ghi chú
  const deleteNote = async (id) => {
    try {
      await db.runAsync("DELETE FROM notesTable WHERE id = ?", [id]);
      fetchNotes();
      Alert.alert("Success", "Note deleted successfully");
    } catch (error) {
      console.error("Error deleting note:", error);
      Alert.alert("Error", "Could not delete note");
    }
  };

  // Xác nhận xóa ghi chú
  const confirmDelete = (id) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => deleteNote(id) },
    ]);
  };

  // Render từng item trong danh sách ghi chú
  const renderNoteItem = ({ item }) => {
    const priorityColor = {
      High: "#ff4d4d",
      Medium: "#ffa500",
      Low: "#4caf50",
    }[item.priority] || "#4caf50";

    // Lấy tasks từ state (đã cập nhật trong useEffect)
    const noteTasks = tasks[item.id] || [];

    // Kiểm tra nếu có remind
    const remindDate = item.reminder; 
    const remindText = remindDate ? `Remind on: ${remindDate}` : null;

    return (
      <TouchableOpacity style={styles.noteCard} onPress={() => viewNote(item.id)}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteDate}>{item.date}</Text>
          <View style={styles.noteMeta}>
            {item.category && <Text style={styles.noteCategory}>{item.category}</Text>}
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text style={styles.priorityText}>{item.priority || "Low"}</Text>
            </View>
          </View>
        </View>

        {/* Hiển thị thông tin remind nếu có */}
        {remindText && (
            <Text style={styles.remindText}>{remindText}</Text>
        )}

        <Text style={styles.noteTitle} numberOfLines={1}>{item.title || "Untitled Note"}</Text>
        <Text style={styles.notePreview} numberOfLines={2}>{item.note.replace(/\n/g, " ")}</Text>

        

        <View style={styles.tasksContainer}>
          <Text style={styles.tasksHeader}>Tasks:</Text>
          {noteTasks.length === 0 ? (
            <Text style={styles.noTasks}>No tasks found for this note.</Text>
          ) : (
            noteTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => toggleTaskCompletion(task.id, item.id, task.completed)}
                style={styles.taskItem}
              >
                <Ionicons
                  name={task.completed ? "checkmark-circle" : "ellipse"}
                  size={16}
                  color={task.completed ? "green" : "#007AFF"}
                  style={styles.taskBullet}
                />
                <Text
                  style={[
                    styles.taskText,
                    task.completed && { textDecorationLine: "line-through", color: "#999" },
                  ]}
                >
                  {task.task}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Hiển thị ảnh thu nhỏ nếu có */}
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.thumbnail} resizeMode="cover" />
        )}

        <View style={styles.completionSection}>
          <TouchableOpacity
            onPress={() => toggleCompletion(item.id, item.completed)}
            style={styles.completionButton}
          >
            <Ionicons
              name={item.completed ? "checkmark-circle" : "checkmark-circle-outline"}
              size={32}
              color={item.completed ? "green" : "#ccc"}
            />
            <Text style={styles.completionText}>
              {item.completed ? "Completed" : "Mark as Completed"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
            <Ionicons name="trash-outline" size={22} color="red" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Hàm refresh lại các bộ lọc
  const handleRefresh = () => {
    setSelectedCategory(null);
    setSelectedPriority(null);
    setSearchQuery("");
    fetchNotes();
  };  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterSection}>
        <Picker selectedValue={selectedCategory} onValueChange={setSelectedCategory} style={styles.picker}>
          <Picker.Item label="All Categories" value={null} />
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
          ))}
        </Picker>

        <Picker selectedValue={selectedPriority} onValueChange={setSelectedPriority} style={styles.picker}>
          <Picker.Item label="All Priorities" value={null} />
          <Picker.Item label="High" value="High" />
          <Picker.Item label="Medium" value="Medium" />
          <Picker.Item label="Low" value="Low" />
        </Picker>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Ionicons name="refresh-outline" size={25} color="#007AFF" />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>

      {notes.length > 0 ? (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>No notes found</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.categoriesButton]}
          onPress={() => navigation.navigate("CategoryScreen")}
        >
          <Ionicons name="list-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => navigation.navigate("AddNote")}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingHorizontal: 16 },
  filterSection: {
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: { height: 50, color: "#333" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 45, color: "#333" },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  refreshText: { marginLeft: 6, color: "#007AFF", fontSize: 14, fontWeight: "500" },
  listContent: { paddingBottom: 80 },
  noteCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  noteHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  noteDate: { fontSize: 13, color: "#666", fontStyle: "italic" },
  noteMeta: { flexDirection: "row", alignItems: "center" },
  noteCategory: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    marginRight: 8,
    color: "#333",
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  priorityText: { color: "white", fontSize: 12, fontWeight: "bold" },
  noteTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 4, color: "#333" },
  notePreview: { fontSize: 16, color: "#666", lineHeight: 20 },
  noteImage: { width: "100%", height: 200, marginTop: 12, borderRadius: 8, resizeMode: "cover" },
  deleteButton: { position: "absolute", right: 10, bottom: 10 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: "#999" },
  actionButtons: {
  flexDirection: "row", // hoặc 'row' nếu muốn nằm ngang
  position: "absolute",
  bottom: 20,
  right: 16,
  gap: 12, // khoảng cách giữa các nút
},
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoriesButton: { backgroundColor: "#34C759" },
  addButton: { backgroundColor: "#007AFF" },
  tasksContainer: { marginTop: 15, marginBottom: 15, },
  tasksHeader: { fontSize: 16, fontWeight: "bold", color: "#333" },
  taskItem: {
    flexDirection: "row",   // Sắp xếp các phần tử theo hàng ngang
    alignItems: "center",   // Căn chỉnh các phần tử theo chiều dọc
    paddingVertical: 6,
    padding: 4,
  },
  taskText: { fontSize: 14, color: "#666" },
  noTasks: { fontSize: 14, color: "#bbb" },
  taskBullet: {
    marginRight: 8,
  },
  thumbnail: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  completionSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  completionButton: { flexDirection: "row", alignItems: "center" },
  completionText: { marginLeft: 6, color: "#333" },
  remindText: {
  marginTop: 8,
  fontSize: 14,
  color: "#FF6347", // Màu sắc nhắc nhở
  fontStyle: "italic",
},
});
