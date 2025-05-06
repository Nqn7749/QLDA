import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const DateTimePickerScreen = ({ initialDate, onDateSelected }) => {
  const [date, setDate] = useState(initialDate || new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (selectedDate) => {
    setDate(selectedDate);
    onDateSelected && onDateSelected(selectedDate);
    hideDatePicker();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.dateDisplay} onPress={showDatePicker}>
        <Text style={styles.dateText}>{date.toLocaleString()}</Text>
        <Text style={styles.labelText}>Nhấn để chọn ngày giờ</Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        minimumDate={new Date()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  dateDisplay: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  labelText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default DateTimePickerScreen;
