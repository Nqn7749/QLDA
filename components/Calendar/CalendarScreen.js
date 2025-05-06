// CalendarScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { Calendar } from "react-native-calendars";
import { useSQLiteContext } from "expo-sqlite";

export default function CalendarScreen() {
  const db = useSQLiteContext();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const result = await db.getAllAsync("SELECT * FROM notesTable WHERE due_date IS NOT NULL");
      const formatted = result.map(note => ({
        ...note,
        date: note.due_date, // date format: 'YYYY-MM-DD'
      }));
      setEvents(formatted);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleDayPress = (day) => {
    const dayEvents = events.filter(event => event.date === day.dateString);
    if (dayEvents.length > 0) {
      Alert.alert(
        "Ghi chú ngày " + day.dateString,
        dayEvents.map(event => `• ${event.title}`).join("\n")
      );
    } else {
      Alert.alert("Không có ghi chú", "Không có ghi chú trong ngày này.");
    }
  };

  const getMarkedDates = () => {
    const marked = {};
    events.forEach(event => {
      if (!marked[event.date]) {
        marked[event.date] = {
          marked: true,
          dots: [{ color: "blue" }],
        };
      } else {
        marked[event.date].dots.push({ color: "blue" });
      }
    });
    return marked;
  };

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={getMarkedDates()}
        onDayPress={handleDayPress}
        markingType="multi-dot"
      />
      <ScrollView style={{ marginTop: 20 }}>
        <Text style={styles.header}>Ghi chú sắp tới</Text>
        {events.length === 0 ? (
          <Text style={styles.noEventsText}>Không có ghi chú để hiển thị.</Text>
        ) : (
          events.map((event, index) => (
            <View key={index} style={styles.eventContainer}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>🗓 {event.date}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  noEventsText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#666",
  },
  eventContainer: {
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  eventDate: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
});
