// src/screens/auth/ForgotPasswordScreen.js
import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, 
  Alert, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import {sendPasswordResetEmail} from '../../firebase/auth';
import {getUserByEmail} from '../../firebase/firestore';

const ForgotPasswordScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRecover = async () => {
    if (!email.trim()) return setError('Email is required');
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Enter a valid email');
    setError('');
    setLoading(true);
    try {
      const matchingUsers = await getUserByEmail(email.trim());
      if (matchingUsers.empty) {
        setLoading(false);
        return setError('This email is not registered. Please sign up.');
      }

      await sendPasswordResetEmail(email.trim());
      Alert.alert(
        'Email Sent!',
        `A password reset link has been sent to ${email}. Please check your inbox.`,
        [{text: 'OK', onPress: () => navigation.navigate('Login')}],
      );
    } catch (e) {
      setError(e.message.replace('Firebase: ', ''));
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.topBg}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.iconCircle}>
              <Icon name="lock-reset" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Don't worry! Enter your email and we'll send you a reset link.
            </Text>
          </View>

          <View style={styles.card}>
            <CustomInput
              label="Registered Email"
              placeholder="Enter your email address"
              value={email}
              onChangeText={t => {setEmail(t); setError('');}}
              iconName="email"
              keyboardType="email-address"
              error={error}
            />
            <CustomButton
              title="Send Reset Link"
              onPress={handleRecover}
              loading={loading}
              iconName="send"
              iconRight
            />
            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}>
              <Icon name="arrow-back" size={16} color={COLORS.primary} />
              <Text style={styles.backToLoginText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  container: {flexGrow: 1},
  topBg: {backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 60, alignItems: 'center', paddingHorizontal: 24, borderBottomLeftRadius: 40, borderBottomRightRadius: 40},
  backBtn: {position: 'absolute', top: 14, left: 16, padding: 6},
  iconCircle: {width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4},
  title: {fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white, marginBottom: 10},
  subtitle: {fontSize: SIZES.sm, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20},
  card: {backgroundColor: COLORS.surface, marginHorizontal: 20, borderRadius: 24, padding: 24, marginTop: -24, elevation: 8, shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.12, shadowRadius: 12},
  backToLogin: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4},
  backToLoginText: {color: COLORS.primary, fontWeight: '600', fontSize: SIZES.sm},
});

export default ForgotPasswordScreen;