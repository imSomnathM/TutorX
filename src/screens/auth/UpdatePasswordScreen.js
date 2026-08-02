// src/screens/auth/UpdatePasswordScreen.js
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
import {updateUserPassword} from '../../firebase/auth';

const PasswordStrength = ({password}) => {
  const getStrength = () => {
    if (!password) return {level: 0, label: '', color: COLORS.border};
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return {level: 1, label: 'Weak', color: COLORS.error};
    if (score <= 3) return {level: 2, label: 'Fair', color: COLORS.warning};
    return {level: 3, label: 'Strong', color: COLORS.success};
  };
  const {level, label, color} = getStrength();
  if (!password) return null;
  return (
    <View style={{marginBottom: 14}}>
      <View style={{flexDirection: 'row', gap: 4, marginBottom: 4}}>
        {[1, 2, 3].map(i => (
          <View key={i} style={{flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= level ? color : COLORS.border}} />
        ))}
      </View>
      <Text style={{fontSize: SIZES.xs, color, fontWeight: '600'}}>{label}</Text>
    </View>
  );
};

const UpdatePasswordScreen = ({navigation}) => {
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!newPass) e.newPass = 'Password is required';
    else if (newPass.length < 6) e.newPass = 'Minimum 6 characters';
    if (!confirm) e.confirm = 'Please confirm your password';
    else if (newPass !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await updateUserPassword(newPass);
      Alert.alert('Success! 🎉', 'Your password has been updated successfully.', [
        {text: 'Sign In', onPress: () => navigation.navigate('Login')},
      ]);
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Session Expired',
          'Please sign in again before updating your password.',
          [{text: 'OK', onPress: () => navigation.navigate('Login')}],
        );
      } else {
        Alert.alert('Error', e.message.replace('Firebase: ', ''));
      }
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
              <Icon name="lock" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>Create a strong new password for your account</Text>
          </View>

          <View style={styles.card}>
            <CustomInput
              label="New Password"
              placeholder="Enter new password"
              value={newPass}
              onChangeText={t => {setNewPass(t); setErrors(p => ({...p, newPass: ''}));}}
              iconName="lock"
              secureTextEntry
              error={errors.newPass}
            />
            <PasswordStrength password={newPass} />

            <CustomInput
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={confirm}
              onChangeText={t => {setConfirm(t); setErrors(p => ({...p, confirm: ''}));}}
              iconName="lock-outline"
              secureTextEntry
              error={errors.confirm}
            />

            <View style={styles.tips}>
              <Text style={styles.tipsTitle}>Password must:</Text>
              {['Be at least 6 characters', 'Include uppercase letters', 'Include numbers'].map(tip => (
                <View key={tip} style={styles.tipRow}>
                  <Icon name="check-circle" size={14} color={COLORS.success} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <CustomButton
              title="Update Password"
              onPress={handleUpdate}
              loading={loading}
              iconName="done-all"
              iconRight
              style={{marginTop: 8}}
            />
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
  subtitle: {fontSize: SIZES.sm, color: 'rgba(255,255,255,0.85)', textAlign: 'center'},
  card: {backgroundColor: COLORS.surface, marginHorizontal: 20, borderRadius: 24, padding: 24, marginTop: -24, elevation: 8, marginBottom: 30},
  tips: {backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 14, marginBottom: 8},
  tipsTitle: {fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text, marginBottom: 8},
  tipRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4},
  tipText: {fontSize: SIZES.xs, color: COLORS.textSecondary},
});

export default UpdatePasswordScreen;
