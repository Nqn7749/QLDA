import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";


export default function ViewNote() {
  const db = useSQLiteContext();
  const route = useRoute();
  const navigation = useNavigation();

  const { id } = route.params;
  const [note, setNote] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedNoteTasks, setSelectedNoteTasks] = useState([]);

  useEffect(() => {
    console.log("Note ID:", id);
    fetchNote();
    fetchTasks();
  }, [id]);

  const fetchNote = async () => {
    try {
      const result = await db.getFirstAsync("SELECT * FROM notesTable WHERE id = ?", [id]);
      if (!result) {
        Alert.alert("Note not found", "This note may have been deleted.");
        navigation.goBack();
        return;
      }
      setNote(result);
    } catch (error) {
      Alert.alert("Error", "Could not load note.");
    }
  };

  const fetchTasks = async () => {
    try {
      const noteId = Number(id);
      const result = await db.getAllAsync("SELECT * FROM tasks WHERE note_id = ?", [noteId]);
      if (result && result.length > 0) {
        setTasks(result);
        setSelectedNoteTasks(result);
      } else {
        setTasks([]);
        setSelectedNoteTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${month}-${day}-${year} ${hours}:${minutes}`;
  };

  const deleteNote = async () => {
    Alert.alert("Delete Note", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          await db.runAsync("DELETE FROM notesTable WHERE id = ?", [id]);
          navigation.goBack();
        }
      }
    ]);
  };

  if (!note) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading note...</Text>
      </View>
    );
  }

  const priorityColor = {
    High: "#ff4d4d",
    Medium: "#ffa500",
    Low: "#4caf50",
  }[note.priority] || "#4caf50";

  // Format remind date if exists
  const remindDate = note.reminder;
    const remindText = remindDate ? `Remind on: ${formatDate(remindDate)}` : null;

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={32} color="#6200ee" />
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteNote}>
            <Ionicons name="trash-outline" size={32} color="red" />
          </TouchableOpacity>
        </View>

        <View style={styles.metaContainer}>
          <Text style={styles.dateText}>{note.date}</Text>
          <View style={styles.tagsContainer}>
            {note.category && <View style={styles.categoryTag}><Text style={styles.categoryText}>{note.category}</Text></View>}
            <View style={[styles.priorityTag, { backgroundColor: priorityColor }]} >
              <Text style={styles.priorityText}>{note.priority}</Text>
            </View>
          </View>
        </View>

        {remindText && <Text style={styles.remindText}>{remindText}</Text>}
        
        <Text style={styles.title}>{note.title}</Text>
        <Text style={styles.content}>{note.note}</Text>

         

        <View style={styles.tasksContainer}>
          <Text style={styles.tasksHeader}>Tasks:</Text>
          {tasks.length === 0 ? (
            <Text style={styles.noTasks}>No tasks found for this note.</Text>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <Text style={styles.taskText}>{task.task}</Text>
              </View>
            ))
          )}
        </View>

        {note.image && (
          <Image source={{ uri: note.image }} style={styles.noteImage} resizeMode="contain" />
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.floatingButton, styles.editButton]}
        onPress={() => navigation.navigate("EditNote", { id })}
      >
        <Ionicons name="create-outline" size={28} color="white" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  metaContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    flexDirection: 'row', 
    justifyContent: 'space-between',  
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: "#000",
  },
  categoryTag: {
    backgroundColor: "#d1c4e9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryText: {
    color: "#4a148c",
    fontWeight: "500",
  },
  priorityTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  priorityText: {
    color: "white",
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
  tasksContainer: {
    marginTop: 20,
  },
  tasksHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noTasks: {
    fontSize: 14,
    color: "#777",
  },
  taskItem: {
    backgroundColor: "#e3f2fd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  taskText: {
    fontSize: 16,
    color: "#333",
  },
  noteImage: {
    width: "100%",
    height: "100%",
    marginTop: 20,
    borderRadius: 8,
  },
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 4,
  },
  editButton: {
    backgroundColor: "#6200ee",
  },
  remindText: {
    color: "#ff4d4d",
    fontSize: 12,
    marginTop: 5,
  },
  
});
