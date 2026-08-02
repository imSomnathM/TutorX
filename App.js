// App.js
import React from 'react';
import {StatusBar} from 'react-native';
import {AuthProvider} from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';

const App = () => {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <RootNavigator />
      <Toast />
    </AuthProvider>
  );
};

export default App;
