//CategoryScreen.js
import React, { useState, useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import Ionicons from "@expo/vector-icons/Ionicons";

const CategoryScreen = () => <CategoryList />;

const CategoryList = () => {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      const result = await db.getAllAsync("SELECT * FROM categories");
      setCategories(result);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const saveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Error", "Category name cannot be empty");
      return;
    }
    try {
      if (editingCategory) {
        await db.runAsync("UPDATE categories SET name = ? WHERE id = ?", [categoryName, editingCategory.id]);
      } else {
        await db.runAsync("INSERT INTO categories (name) VALUES (?)", [categoryName]);
      }
      setModalVisible(false);
      setCategoryName("");
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      Alert.alert("Error", "This category already exists");
      console.error("Error saving category:", error);
    }
  };

  const deleteCategory = async (id) => {
    try {
      const notes = await db.getAllAsync(
        "SELECT * FROM notesTable WHERE category = (SELECT name FROM categories WHERE id = ?)",
        [id]
      );

      if (notes.length > 0) {
        Alert.alert(
          "Cannot Delete",
          "This category is being used by some notes. Please change those notes to another category first."
        );
        return;
      }
      await db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.categoryItem}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => editCategory(item)}>
                <Ionicons name="pencil-outline" size={20} color="#6200ee" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteCategory(item.id)}>
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Category name"
              value={categoryName}
              onChangeText={setCategoryName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveCategory}>
                <Text style={styles.buttonText}>{editingCategory ? "Update" : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  categoryItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, marginVertical: 8, backgroundColor: "#f5f5f5", borderRadius: 8 },
  categoryName: { fontSize: 16 },
  actions: { flexDirection: "row", gap: 16 },
  addButton: { position: "absolute", left: 20, bottom: 20, backgroundColor: "#6200ee", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 5 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", backgroundColor: "white", padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginBottom: 20 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  cancelButton: { backgroundColor: "#ccc", padding: 10, borderRadius: 5, flex: 1, marginRight: 10, alignItems: "center" },
  saveButton: { backgroundColor: "#6200ee", padding: 10, borderRadius: 5, flex: 1, marginLeft: 10, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "bold" },
});

export default CategoryScreen;
