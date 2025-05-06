//AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Import các màn hình
import HomeScreen from '../HomeScreen/HomeScreen';
import Notes from "../Notes/NotesScreen";
import AddNote from "../Notes/AddNote";
import ViewNote from "../Notes/ViewNote";
import CategoryScreen from "../Category/CategoryScreen";
import CompleteTaskScreen from "../Notes/CompleteTaskScreen";
import EditNote from "../Notes/EditNote";
import CalendarScreen from "../Calendar/CalendarScreen";
import Report from "../BaoCao/Report";
import DateTimePickerScreen from "../Backend/DateTimePickerScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home QLDA">
        <Stack.Screen name="Home QLDA" component={HomeScreen} />
        <Stack.Screen name="NotesScreen" component={Notes} />
        <Stack.Screen name="AddNote" component={AddNote} />
        <Stack.Screen name="ViewNote" component={ViewNote} />
        <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
        <Stack.Screen name="CompleteTaskScreen" component={CompleteTaskScreen} />
        <Stack.Screen name="EditNote" component={EditNote} />
        <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
        <Stack.Screen name="Report" component={Report} />
        <Stack.Screen name="DateTimePickerScreen" component={DateTimePickerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
