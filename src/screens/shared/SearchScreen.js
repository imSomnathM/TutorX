// src/screens/shared/SearchScreen.js
import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, ScrollView,
   StatusBar, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import TutorCard from '../../components/TutorCard';
import SubjectBadge from '../../components/SubjectBadge';
import BottomNavBar from '../../components/BottomNavBar';
import {searchTutors, getAllBatches} from '../../firebase/firestore';
import LocationService from '../../services/LocationService';

const SUBJECTS = ['All','Math','Physics','Chemistry','Biology','History','English','Bengali','Computer Science'];

const SearchScreen = ({navigation}) => {
  const [query, setQuery] = useState('');
  const [tutors, setTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('All');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    (async () => {
      let location = null;
      try {
        location = await LocationService.getCurrentLocation();
      } catch (_) {
        // No GPS/IP location available — search still works, just unsorted.
      }
      searchTutors('', location).then(data => {
        setTutors(data);
        setFilteredTutors(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    })();
  }, []);

  const applyFilter = useCallback((q, subject) => {
    let result = tutors;
    if (subject !== 'All') {
      result = result.filter(t => t.subjects?.toLowerCase().includes(subject.toLowerCase()));
    }
    if (q.trim()) {
      const lq = q.toLowerCase();
      result = result.filter(
        t => t.name?.toLowerCase().includes(lq) ||
             t.subjects?.toLowerCase().includes(lq) ||
             t.address?.toLowerCase().includes(lq) ||
             t.qualification?.toLowerCase().includes(lq),
      );
    }
    setFilteredTutors(result);
  }, [tutors]);

  const handleSearch = text => {
    setQuery(text);
    applyFilter(text, activeSubject);
  };

  const handleSubject = subj => {
    setActiveSubject(subj);
    applyFilter(query, subj);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="search-off" size={64} color={COLORS.border} />
      <Text style={styles.emptyTitle}>No tutors found</Text>
      <Text style={styles.emptyDesc}>Try a different search term or subject filter</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Search header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find a Tutor</Text>
        <Text style={styles.subtitle}>{filteredTutors.length} tutors available</Text>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Icon name="search" size={22} color={searchFocused ? COLORS.primary : COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, subject, location..."
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Subject filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.filterList}
        style={{maxHeight: 52, flexGrow: 0}}>
        {SUBJECTS.map(item => (
          <SubjectBadge
            key={item}
            subject={item}
            active={activeSubject === item}
            onPress={() => handleSubject(item)}
          />
        ))}
      </ScrollView>

      {/* Tutors list */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding tutors...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTutors}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            // <TutorCard tutor={item} onPress={() => {}} />
            <TutorCard
              tutor={item}
              onPress={() =>
                navigation.navigate('TutorProfile', {
                    tutorId: item.id,
                })
    }
            />
          )}
        />
      )}

      <BottomNavBar activeRoute="Search" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  header: {paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12},
  title: {fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text},
  subtitle: {fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 14},
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchBarFocused: {borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight},
  searchInput: {flex: 1, fontSize: SIZES.md, color: COLORS.text, padding: 0},
  filterList: {paddingHorizontal: 12, paddingBottom: 8},
  list: {paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1},
  loaderContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {marginTop: 12, color: COLORS.textSecondary},
  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8},
  emptyTitle: {fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text},
  emptyDesc: {fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 30},
});

export default SearchScreen;