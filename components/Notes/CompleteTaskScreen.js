import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, Button, Image } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function CompleteTaskScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const [completedNotes, setCompletedNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [tasks, setTasks] = useState({});
  const [selectedNoteTasks, setSelectedNoteTasks] = useState([]);

  const fetchCompletedNotes = async () => {
    try {
      const result = await db.getAllAsync("SELECT * FROM notesTable WHERE completed = 1 ORDER BY date DESC");
      const validNotes = result.filter(note => note && note.title);
      setCompletedNotes(validNotes);
    } catch (error) {
      console.error("Error fetching completed notes:", error);
      Alert.alert("Error", "Could not fetch completed notes.");
    }
  };

  const fetchTasks = async (noteId) => {
    try {
      const result = await db.getAllAsync("SELECT * FROM tasks WHERE note_id = ?", [noteId]);
      return result || [];
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchCompletedNotes();
  }, []);

  useEffect(() => {
    const loadTasksForSelectedNote = async () => {
      if (selectedNote) {
        const tasks = await fetchTasks(selectedNote.id);
        setSelectedNoteTasks(tasks);
      }
    };

    loadTasksForSelectedNote();
  }, [selectedNote]);

  useEffect(() => {
    const updateTasks = async () => {
      const tasksMap = {};
      for (let note of completedNotes) {
        const noteTasks = await fetchTasks(note.id);
        tasksMap[note.id] = noteTasks;
      }
      setTasks(tasksMap);
    };

    if (completedNotes.length > 0) {
      updateTasks();
    }
  }, [completedNotes]);

  const undoComplete = async (noteId) => {
    try {
      await db.runAsync("UPDATE notesTable SET completed = 0 WHERE id = ?", [noteId]);
      setCompletedNotes(prev => prev.filter(note => note.id !== noteId));
      Alert.alert("Success", "Note marked as not completed.");
    } catch (error) {
      console.error("Error undoing completion:", error);
      Alert.alert("Error", "Could not undo completion.");
    }
  };

  const confirmDelete = (noteId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.runAsync("DELETE FROM notesTable WHERE id = ?", [noteId]);
              setCompletedNotes(prev => prev.filter(note => note.id !== noteId));
              Alert.alert("Success", "Note deleted successfully.");
            } catch (error) {
              console.error("Error deleting note:", error);
              Alert.alert("Error", "Could not delete the note.");
            }
          },
        },
      ]
    );
  };

  const renderCompletedNote = ({ item }) => {
    if (!item || !item.title) return null;

    const priorityColor = {
      High: "#ff4d4d",
      Medium: "#ffa500",
      Low: "#4caf50",
    }[item.priority] || "#4caf50";

    const noteTasks = tasks[item.id] || [];

    return (
      <TouchableOpacity style={styles.noteCard} onPress={() => setSelectedNote(item)}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteDate}>{item.date}</Text>
          <View style={styles.noteMeta}>
            {item.category && <Text style={styles.noteCategory}>{item.category}</Text>}
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text style={styles.priorityText}>{item.priority || "Low"}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.noteTitle} numberOfLines={1}>{item.title || "Untitled Note"}</Text>
        <Text style={styles.notePreview} numberOfLines={2}>{item.note?.replace(/\n/g, " ") || "No preview available"}</Text>

        <View style={styles.tasksContainer}>
          <Text style={styles.tasksHeader}>Tasks:</Text>
          {noteTasks.length === 0 ? (
            <Text style={styles.noTasks}>No tasks found for this note.</Text>
          ) : (
            noteTasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <Ionicons name="ellipse" size={10} color="#007AFF" style={styles.taskBullet} />
                <Text style={styles.taskText}>{task.task}</Text>
              </View>
            ))
          )}
        </View>

        {item.image && (
          <Image source={{ uri: item.image }} style={styles.thumbnail} resizeMode="cover" />
        )}

        <View style={styles.completionSection}>
          <View style={styles.completionButton}>
            <Ionicons name="checkmark-circle" size={24} color="green" />
            <Text style={styles.completionText}>Completed</Text>
          </View>

          <TouchableOpacity style={styles.undoButton} onPress={() => undoComplete(item.id)}>
            <Ionicons name="arrow-undo" size={32} color="blue" />
            <Text style={styles.undoText}>Undo Complete</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
            <Ionicons name="trash-outline" size={22} color="red" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={completedNotes}
        renderItem={renderCompletedNote}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />

      {selectedNote && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedNote(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedNote.title}</Text>
              <Text style={styles.modalDate}>{selectedNote.date}</Text>
              <Text style={styles.modalCategory}>Category: {selectedNote.category || "No Category"}</Text>
              <Text style={styles.modalNote}>{selectedNote.note}</Text>
              <Text style={styles.modalPriority}>Priority: {selectedNote.priority}</Text>

              <View style={styles.tasksContainer}>
                <Text style={styles.tasksHeader}>Tasks:</Text>
                {selectedNoteTasks.length === 0 ? (
                  <Text style={styles.noTasks}>No tasks found for this note.</Text>
                ) : (
                  selectedNoteTasks.map((task) => (
                    <View key={task.id} style={styles.taskItem}>
                      <Ionicons name="ellipse" size={10} color="#007AFF" style={styles.taskBullet} />
                      <Text style={styles.taskText}>{task.task}</Text>
                    </View>
                  ))
                )}
              </View>

              {selectedNote.image && (
                <Image source={{ uri: selectedNote.image }} style={styles.fullImage} resizeMode="contain" />
              )}

              <Button title="Close" onPress={() => setSelectedNote(null)} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  noteCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  noteDate: { fontSize: 12, color: "#777" },
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
  noteTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  notePreview: { fontSize: 14, color: "#555", marginBottom: 8 },
  completionSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  completionButton: { flexDirection: "row", alignItems: "center" },
  completionText: { marginLeft: 6, fontSize: 14, color: "green" },
  undoButton: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 10 },
  undoText: { fontSize: 12, color: "blue" },
  deleteButton: { marginLeft: 10 },
  listContent: { paddingBottom: 80 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "85%",
    maxHeight: "80%",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalDate: { fontSize: 14, color: "#666", marginBottom: 8 },
  modalCategory: { fontSize: 16, color: "#333", marginBottom: 8, fontWeight: "bold" },
  modalNote: { fontSize: 14, marginBottom: 16 },
  modalPriority: { fontSize: 14, marginBottom: 16, color: "#333" },
  thumbnail: { width: "100%", height: 150, borderRadius: 8, marginBottom: 10 },
  fullImage: { width: "100%", height: 200, marginBottom: 16, borderRadius: 10 },
  tasksContainer: { marginTop: 12 },
  tasksHeader: { fontSize: 14, fontWeight: "bold", color: "#333" },
  taskItem: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  taskText: { fontSize: 14, color: "#666" },
  noTasks: { fontSize: 14, color: "#bbb" },
  taskBullet: { marginRight: 8 },
});
