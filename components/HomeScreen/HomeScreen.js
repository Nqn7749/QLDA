import React from "react";
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ImageBackground 
} from "react-native";

const HomeScreen = ({ navigation }) => {
  const confirmExit = () => {
    // Thêm logic xác nhận thoát ở đây
    console.log("Exit confirmed");
  };

  return (
    <ImageBackground 
      source={require('../../assets/e7a7e1b7a1dfd69b0f1a95e9b65ff06c.jpg')} 
      style={styles.background}
    >
      <View style={styles.centeredContainer}>
        <TouchableOpacity
          style={styles.notesButton}
          onPress={() => navigation.navigate("CalendarScreen")}
        >
          <Text style={styles.notesButtonText}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notesButton}
          onPress={() => navigation.navigate("NotesScreen")}
        >
          <Text style={styles.notesButtonText}>Danh sách công việc</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.completedButton}
          onPress={() => navigation.navigate("CompleteTaskScreen")}
        >
          <Text style={styles.completedButtonText}>Công việc đã hoàn thành</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.completedButton}
          onPress={() => navigation.navigate("Report")}
        >
          <Text style={styles.completedButtonText}>Xem báo cáo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exitButton}
          onPress={confirmExit}
        >
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",  
  },
  notesButton: {
    width: "70%",  
    padding: 15,
    backgroundColor: "#99FF99",
    borderColor: "#6200ee",
    borderWidth: 3,
    borderRadius: 20,
    marginVertical: 10,  
    justifyContent: "center",  
    alignItems: "center",  
  },
  notesButtonText: {
    textAlign: "center",
    color: "#6200ee",
    fontWeight: "bold",
  },
  completedButton: {
    width: "70%",  
    padding: 15,
    backgroundColor: "#66FFFF",
    borderColor: "red",
    borderWidth: 3,
    borderRadius: 20,
    marginVertical: 10,  
    justifyContent: "center",  
    alignItems: "center",  
  },
  completedButtonText: {
    textAlign: "center",
    color: "red",
    fontWeight: "bold",
  },
  exitButton: {
    width: "70%", 
    padding: 15,
    backgroundColor: "#FF6666",
    borderColor: "darkred",
    borderWidth: 3,
    borderRadius: 20,
    marginVertical: 10,  
    justifyContent: "center",  
    alignItems: "center",  
  },
  exitButtonText: {
    textAlign: "center",
    color: "darkred",
    fontWeight: "bold",
  },
});

export default HomeScreen;