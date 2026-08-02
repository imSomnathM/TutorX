// src/navigation/StudentNavigator.js
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import StudentEditProfileScreen from '../screens/student/StudentEditProfileScreen';
import MySessionsScreen from '../screens/student/MySessionsScreen';
import RateReviewScreen from '../screens/student/RateReviewScreen';
import TutorProfileScreen from '../screens/student/TutorProfileScreen';
import SearchScreen from '../screens/shared/SearchScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';

const Stack = createNativeStackNavigator();

const StudentNavigator = () => (
  <Stack.Navigator
    initialRouteName="Home"
    screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
    <Stack.Screen name="Home" component={StudentHomeScreen} />
    <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
    <Stack.Screen name="StudentEditProfile" component={StudentEditProfileScreen} />
    <Stack.Screen name="Batches" component={MySessionsScreen} />
    <Stack.Screen name="RateReview" component={RateReviewScreen} />
    <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
    <Stack.Screen name="Search" component={SearchScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

export default StudentNavigator;