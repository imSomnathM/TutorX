// src/navigation/AuthNavigator.js
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/auth/HomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import AdditionalInfoStudentScreen from '../screens/auth/AdditionalInfoStudentScreen';
import AdditionalInfoTutorScreen from '../screens/auth/AdditionalInfoTutorScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import UpdatePasswordScreen from '../screens/auth/UpdatePasswordScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator
    initialRouteName="Home"
    screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="AdditionalInfoStudent" component={AdditionalInfoStudentScreen} />
    <Stack.Screen name="AdditionalInfoTutor" component={AdditionalInfoTutorScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="Otp" component={OtpScreen} />
    <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;
