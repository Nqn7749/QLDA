import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import DateTimePickerScreen from "../Backend/DateTimePickerScreen"; // cập nhật import mới

export default function AddNote() {
  return <NoteForm />;
}

function NoteForm() {
  const db = useSQLiteContext();
  const navigation = useNavigation();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [image, setImage] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [reminderTime, setReminderTime] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await db.getAllAsync("SELECT * FROM categories");
        setCategories(result);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const originalUri = result.assets[0].uri;
      const savedUri = await saveImageToAppFolder(originalUri);
      setImage(savedUri);
    }
  };

  const saveImageToAppFolder = async (uri) => {
    try {
      if (uri.startsWith(FileSystem.documentDirectory)) {
        return uri;
      }
      const fileName = uri.split("/").pop();
      const newPath = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({ from: uri, to: newPath });
      return newPath;
    } catch (error) {
      console.error("Error saving image:", error);
      return null;
    }
  };

  const handleDeleteImage = async () => {
    if (image && image.startsWith(FileSystem.documentDirectory)) {
      try {
        await FileSystem.deleteAsync(image);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
    setImage(null);
  };

  const handleAddTask = () => {
    if (taskInput.trim()) {
      setTasks([...tasks, taskInput.trim()]);
      setTaskInput("");
    }
  };

  const handleRemoveTask = (taskToRemove) => {
    setTasks(tasks.filter((task) => task !== taskToRemove));
  };

  const scheduleNotification = async (noteId) => {
    if (!reminderTime) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || "Reminder",
        body: note || "Don't forget about this note!",
        data: { noteId: noteId.toString() },
      },
      trigger: {
        date: reminderTime,
      },
    });
  };

  const handleAddNote = async () => {
    if (!title.trim() || !note.trim()) {
      Alert.alert("Validation", "Title and note content are required.");
      return;
    }

    const date = new Date().toLocaleDateString("vi-VN");
    const imagePath = image ? await saveImageToAppFolder(image) : null;

    try {
      const result = await db.runAsync(
        `INSERT INTO notesTable (date, title, note, priority, category, image, reminder)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [date, title, note, priority, selectedCategory, imagePath, reminderTime?.toISOString()]
      );

      const noteId = result.lastInsertRowId;
      if (!noteId) throw new Error("Failed to get note ID");

      for (const task of tasks) {
        await db.runAsync(
          `INSERT INTO tasks (note_id, task) VALUES (?, ?)`,
          [noteId, task]
        );
      }

      if (reminderTime) {
        await scheduleNotification(noteId);
      }

      Alert.alert("Success", "Note added successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error adding note:", error);
      Alert.alert("Error", "Could not add note");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TextInput
          style={styles.inputTitle}
          placeholder="Note Title"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.inputNote}
          multiline
          placeholder="Write your note here..."
          value={note}
          onChangeText={setNote}
        />

        <Text style={styles.sectionTitle}>Tasks</Text>
        <View style={styles.taskRow}>
          <TextInput
            value={taskInput}
            onChangeText={setTaskInput}
            placeholder="Add task"
            style={styles.taskInput}
          />
          <Button title="Add" onPress={handleAddTask} />
        </View>

        {tasks.map((task, index) => (
          <View key={index} style={styles.taskItem}>
            <Text>• {task}</Text>
            <TouchableOpacity onPress={() => handleRemoveTask(task)}>
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity 
              style={styles.deleteImageButton} 
              onPress={handleDeleteImage}
            >
              <Text style={styles.deleteImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <Button 
          title="Pick an Image" 
          onPress={pickImage} 
          color="#007AFF"
        />

        <Text style={styles.sectionTitle}>Priority</Text>
        <Picker
          selectedValue={priority}
          onValueChange={setPriority}
          style={styles.picker}
        >
          <Picker.Item label="Low" value="Low" />
          <Picker.Item label="Medium" value="Medium" />
          <Picker.Item label="High" value="High" />
        </Picker>

        <Text style={styles.sectionTitle}>Category</Text>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={setSelectedCategory}
          style={styles.picker}
        >
          <Picker.Item label="No Category" value={null} />
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
          ))}
        </Picker>

        <Text style={styles.sectionTitle}>Reminder</Text>
        <DateTimePickerScreen
          initialDate={reminderTime}
          onDateSelected={setReminderTime}
        />

        <View style={styles.submitButton}>
          <Button 
            title="Save Note" 
            onPress={handleAddNote} 
            color="#5856D6"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    paddingVertical: 10,
    color: '#333',
  },
  inputNote: {
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    marginBottom: 5,
    backgroundColor: '#fff',
  },
  deleteIcon: {
    color: 'red',
    fontSize: 18,
  },
  imageContainer: {
    marginVertical: 15,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  deleteImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteImageText: {
    color: 'white',
    fontSize: 16,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    marginTop: 30,
  },
});
