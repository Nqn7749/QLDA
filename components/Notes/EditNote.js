import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerScreen from "../Backend/DateTimePickerScreen";

export default function EditNote() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const { id } = useRoute().params;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(null);
  const [priority, setPriority] = useState("Low");
  const [image, setImage] = useState(null);
  const [taskInput, setTaskInput] = useState("");
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reminder, setReminder] = useState(null);

  useEffect(() => {
    fetchNote();
    fetchCategories();
    fetchTasks();
  }, []);

  const fetchNote = async () => {
    const result = await db.getFirstAsync("SELECT * FROM notesTable WHERE id = ?", [id]);
    if (result) {
      setTitle(result.title);
      setContent(result.note);
      setCategory(result.category || null);
      setPriority(result.priority || "Low");
      setImage(result.image || null);
      setReminder(result.reminder || null);
    } else {
      Alert.alert("Error", "Note not found.");
    }
  };

  const fetchCategories = async () => {
    const result = await db.getAllAsync("SELECT name FROM categories");
    setCategories(result.map(row => row.name));
  };

  const fetchTasks = async () => {
    const results = await db.getAllAsync("SELECT * FROM tasks WHERE note_id = ?", [id]);
    setTasks(results);
  };

  const handleAddTask = async () => {
    if (!taskInput.trim()) return;
    await db.runAsync("INSERT INTO tasks (note_id, task) VALUES (?, ?)", [id, taskInput.trim()]);
    setTaskInput("");
    fetchTasks();
  };

  const handleRemoveTask = async (taskId) => {
    await db.runAsync("DELETE FROM tasks WHERE id = ?", [taskId]);
    fetchTasks();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("Permission denied", "Please allow access to your media.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const saveImageToAppFolder = async (uri) => {
    const fileName = uri.split("/").pop();
    const newPath = FileSystem.documentDirectory + fileName;
    if (uri !== newPath) {
      await FileSystem.copyAsync({ from: uri, to: newPath });
    }
    return newPath;
  };

  const handleDeleteImage = async () => {
    setImage(null);
    if (image) {
      const filePath = FileSystem.documentDirectory + image.split("/").pop();
      try {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }
  };

  const updateNote = async () => {
    const imagePath = image ? await saveImageToAppFolder(image) : null;
    await db.runAsync(
      "UPDATE notesTable SET title = ?, note = ?, category = ?, priority = ?, image = ?, reminder = ? WHERE id = ?",
  [title, content, category, priority, imagePath, reminder, id]
    );
    Alert.alert("Success", "Note updated.");
    navigation.pop(2);
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        style={styles.inputTitle}
        value={title}
        onChangeText={setTitle}
        placeholder="Note title"
      />
      <TextInput
        style={styles.inputContent}
        value={content}
        onChangeText={setContent}
        placeholder="Note content"
        multiline
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={category} onValueChange={setCategory}>
          <Picker.Item label="No Category" value={null} />
          {categories.map((c, idx) => (
            <Picker.Item key={idx} label={c} value={c} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={priority} onValueChange={setPriority}>
          <Picker.Item label="Low" value="Low" />
          <Picker.Item label="Medium" value="Medium" />
          <Picker.Item label="High" value="High" />
        </Picker>
      </View>

      

      <Text style={styles.label}>Tasks</Text>
      <View style={styles.taskRow}>
        <TextInput
          style={styles.taskInput}
          value={taskInput}
          onChangeText={setTaskInput}
          placeholder="Add task"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text>Add</Text>
        </TouchableOpacity>
      </View>

      {tasks.map((task) => (
        <View key={task.id} style={styles.taskItemRow}>
          <Text style={styles.taskItem}>• {task.task}</Text>
          <TouchableOpacity onPress={() => handleRemoveTask(task.id)}>
            <Text style={styles.removeTask}>❌</Text>
          </TouchableOpacity>
        </View>
      ))}

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity style={styles.deleteImageButton} onPress={handleDeleteImage}>
            <Text style={styles.deleteImageText}>❌</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>Change Image</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Reminder</Text>
      {reminder ? (
        <View style={styles.reminderContainer}>
          <Text style={styles.reminderText}>⏰ {new Date(reminder).toLocaleString()}</Text>
          <TouchableOpacity onPress={() => setReminder(null)}>
            <Text style={styles.removeTask}>❌</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.reminderButton}
          onPress={async () => {
            const selected = await DateTimePickerScreen();
            if (selected) {
              setReminder(selected.toISOString());
            }
          }}
        >
          <Text style={styles.imageButtonText}>Set Reminder</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={updateNote}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f4f6f9" },
  inputTitle: {
    fontSize: 22,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
  },
  inputContent: {
    height: 120,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  label: { fontSize: 16, fontWeight: "600", marginTop: 16 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  imageContainer: {
    marginTop: 16,
    height: 300,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%", borderRadius: 10 },
  deleteImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 5,
  },
  deleteImageText: { color: "white", fontSize: 20 },
  imageButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#6200ee",
    alignItems: "center",
  },
  imageButtonText: { color: "white", fontWeight: "bold" },
  taskRow: { flexDirection: "row", marginBottom: 10 },
  taskInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#4caf50",
    padding: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  taskItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  taskItem: { fontSize: 15, marginLeft: 10 },
  removeTask: { fontSize: 18, color: "red", marginRight: 10 },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#4caf50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { fontSize: 16, fontWeight: "bold", color: "white" },
  reminderButton: {
  marginTop: 10,
  padding: 10,
  borderRadius: 8,
  backgroundColor: "#2196f3",
  alignItems: "center",
},
reminderContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 10,
  backgroundColor: "#e0f7fa",
  borderRadius: 8,
  marginTop: 8,
},
reminderText: {
  fontSize: 16,
  color: "#00796b",
},
});
