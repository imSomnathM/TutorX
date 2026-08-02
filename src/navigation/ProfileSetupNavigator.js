import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import AdditionalInfoStudentScreen from '../screens/auth/AdditionalInfoStudentScreen';
import AdditionalInfoTutorScreen from '../screens/auth/AdditionalInfoTutorScreen';

const Stack = createNativeStackNavigator();

const ProfileSetupNavigator = ({role}) => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {role === 'teacher' ? (
        <Stack.Screen
          name="AdditionalInfoTutor"
          component={AdditionalInfoTutorScreen}
        />
      ) : (
        <Stack.Screen
          name="AdditionalInfoStudent"
          component={AdditionalInfoStudentScreen}
        />
      )}
    </Stack.Navigator>
  );
};

export default ProfileSetupNavigator;