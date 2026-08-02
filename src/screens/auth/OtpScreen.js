// src/screens/auth/OtpScreen.js
import React, {useRef, useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
   ScrollView, Alert, StatusBar,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import CustomButton from '../../components/CustomButton';
import {sendPasswordResetEmail} from '../../firebase/auth';

const OTP_LENGTH = 6;

const OtpScreen = ({route, navigation}) => {
  const {email} = route.params;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const refs = useRef(Array(OTP_LENGTH).fill(null).map(() => React.createRef()));

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) {setCanResend(true); clearInterval(interval); return 0;}
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = text.slice(-1);
    setOtp(newOtp);
    if (text && idx < OTP_LENGTH - 1) {
      refs.current[idx + 1].current?.focus();
    }
  };

  const handleKeyPress = ({nativeEvent}, idx) => {
    if (nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      refs.current[idx - 1].current?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return Alert.alert('Error', 'Please enter the complete OTP');
    // For Firebase email link reset, user clicks the link in email.
    // Here we navigate to UpdatePassword. In production, verify OTP via Cloud Function.
    navigation.navigate('UpdatePassword', {email, otp: code});
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await sendPasswordResetEmail(email);
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendTimer(60);
      setCanResend(false);
      Alert.alert('Sent!', 'OTP resent to your email');
      // restart timer
      const interval = setInterval(() => {
        setResendTimer(t => {
          if (t <= 1) {setCanResend(true); clearInterval(interval); return 0;}
          return t - 1;
        });
      }, 1000);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topBg}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.iconCircle}>
            <Icon name="mark-email-read" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit OTP to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.enterLabel}>Enter OTP</Text>
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={refs.current[i]}
                style={[styles.otpBox, digit && styles.otpBoxFilled]}
                value={digit}
                onChangeText={t => handleChange(t, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <CustomButton
            title="Verify OTP"
            onPress={handleVerify}
            iconName="verified"
            iconRight
          />

          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTimer}>
                Resend OTP in{' '}
                <Text style={{color: COLORS.primary, fontWeight: '700'}}>{resendTimer}s</Text>
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
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
  subtitle: {fontSize: SIZES.sm, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22},
  emailText: {fontWeight: '700', color: COLORS.white},
  card: {backgroundColor: COLORS.surface, marginHorizontal: 20, borderRadius: 24, padding: 24, marginTop: -24, elevation: 8},
  enterLabel: {fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, marginBottom: 18, textAlign: 'center'},
  otpRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28},
  otpBox: {
    width: 46, height: 54,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, fontSize: 22,
    color: COLORS.text, backgroundColor: COLORS.background,
  },
  otpBoxFilled: {borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight},
  resendRow: {alignItems: 'center', marginTop: 4},
  resendTimer: {fontSize: SIZES.sm, color: COLORS.textSecondary},
  resendLink: {fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '700'},
});

export default OtpScreen;
