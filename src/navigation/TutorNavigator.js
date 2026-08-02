// src/navigation/TutorNavigator.js
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TutorHomeScreen from '../screens/tutor/TutorHomeScreen';
import TutorProfileScreen from '../screens/tutor/TutorProfileScreen';
import TutorEditProfileScreen from '../screens/tutor/TutorEditProfileScreen';
import TutorBatchesScreen from '../screens/tutor/TutorBatchesScreen';
import CreateBatchScreen from '../screens/tutor/CreateBatchScreen';
import EditBatchScreen from '../screens/tutor/EditBatchScreen';
import ManageStudentsScreen from '../screens/tutor/ManageStudentsScreen';
import SearchScreen from '../screens/shared/SearchScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';

const Stack = createNativeStackNavigator();

const TutorNavigator = () => (
  <Stack.Navigator
    initialRouteName="Home"
    screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
    <Stack.Screen name="Home" component={TutorHomeScreen} />
    <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
    <Stack.Screen name="TutorEditProfile" component={TutorEditProfileScreen} />
    <Stack.Screen name="Batches" component={TutorBatchesScreen} />
    <Stack.Screen name="CreateBatch" component={CreateBatchScreen} />
    <Stack.Screen name="EditBatch" component={EditBatchScreen} />
    <Stack.Screen name="ManageStudents" component={ManageStudentsScreen} />
    <Stack.Screen name="Search" component={SearchScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

export default TutorNavigator;
