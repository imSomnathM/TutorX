import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {ActivityIndicator, View, StyleSheet} from 'react-native';

import {useAuth} from '../context/AuthContext';

import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import TutorNavigator from './TutorNavigator';
import ProfileSetupNavigator from './ProfileSetupNavigator';

import {COLORS} from '../theme/colors';

const RootNavigator = () => {
  const {user, role, profileCompleted, loading} = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  // return (
  //   <NavigationContainer>
  //     {!user ? (
  //       <AuthNavigator />
  //     ) : role === 'teacher' ? (
  //       <TutorNavigator />
  //     ) : (
  //       <StudentNavigator />
  //     )}
  //   </NavigationContainer>
  // );


  if (!user) {
    return (
        <NavigationContainer>
            <AuthNavigator />
        </NavigationContainer>
    );
}

if (!profileCompleted) {
  if (!role) {
    // Right after sign-up, onAuthStateChanged can read the Firestore user
    // doc before SignUpScreen's saveUserBase() write (which sets the
    // chosen role) has landed. If we render ProfileSetupNavigator with
    // role = null here, it defaults to the Student screen for a moment
    // before refreshUserData() flips it to Tutor — the flicker you saw.
    // Showing a spinner instead of guessing avoids that flash entirely.
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <ProfileSetupNavigator role={role} />
    </NavigationContainer>
  );
}

return (
    <NavigationContainer>
        {role === "teacher"
            ? <TutorNavigator />
            : <StudentNavigator />}
    </NavigationContainer>
);
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default RootNavigator;