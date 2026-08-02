// src/screens/auth/HomeScreen.js
import React, {useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList,  StatusBar, Image,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {COLORS, SIZES} from '../../theme/colors';
import TutorCard from '../../components/TutorCard';
import SubjectBadge from '../../components/SubjectBadge';
import {getFeaturedTutors} from '../../firebase/firestore';

const SUBJECTS = ['Math','Physics','History','English','Chemistry','Geography','Bengali'];

const MOCK_TUTORS = [
  {id: '1', name: 'Anny Sir', address: 'Puabagan'},
  {id: '2', name: "Bunny Ma'am", address: 'Rajagram'},
  {id: '3', name: 'Chintu Sir', address: 'Jagadalla'},
  {id: '4', name: 'Dino Sir', address: 'Damodar Pur'},
  {id: '5', name: 'Rudra Sir', address: 'Puabagan'},
  {id: '6', name: "Sweta Ma'am", address: 'Rajagram'},
  {id: '7', name: 'Raju Sir', address: 'Lokpur'},
];

const HomeScreen = ({navigation}) => {
  const [tutors, setTutors] = useState(MOCK_TUTORS);

  useEffect(() => {
    getFeaturedTutors()
      .then(snap => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        if (data.length > 0) setTutors(data);
      })
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>TutorX</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupBtnText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Connect with the best tutors near you</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>100+</Text>
              <Text style={styles.statLabel}>Teachers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
          </View>
        </View>

        {/* Banner */}
        <View style={styles.bannerWrap}>
          <Image
            source={{uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80'}}
            style={styles.banner}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerText}>Find Your Perfect Tutor Today</Text>
          </View>
        </View>

        {/* Featured Tutors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Tutor</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={tutors}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <TutorCard
                tutor={item}
                horizontal
                onPress={() => navigation.navigate('Login')}
              />
            )}
          />
        </View>

        {/* Subjects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.subjectsWrap}>
            {SUBJECTS.map(s => (
              <SubjectBadge
                key={s}
                subject={s}
                onPress={() => navigation.navigate('Login')}
              />
            ))}
          </View>
        </View>
        <View style={{height: 30}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 16,

    backgroundColor: COLORS.primary,
},
  appName: {fontSize: 26, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5},
  headerBtns: {flexDirection: 'row', gap: 8},
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  loginBtnText: {color: COLORS.white, fontWeight: '600', fontSize: SIZES.sm},
  signupBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  signupBtnText: {color: COLORS.primary, fontWeight: '600', fontSize: SIZES.sm},
  heroSection: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 4,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitle: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 20,
    lineHeight: 30,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {alignItems: 'center'},
  statNumber: {fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white},
  statLabel: {fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2},
  statDivider: {width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)'},
  bannerWrap: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 170,
  },
  banner: {width: '100%', height: '100%'},
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(79,70,229,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  bannerText: {color: COLORS.white, fontWeight: '700', fontSize: SIZES.lg},
  section: {paddingHorizontal: 16, marginTop: 22},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text},
  seeAll: {fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600'},
  subjectsWrap: {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4},
});

export default HomeScreen;
