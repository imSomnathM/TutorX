// src/screens/tutor/EditBatchScreen.js
import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
   Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {COLORS, SIZES} from '../../theme/colors';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import {updateBatch} from '../../firebase/firestore';
import LocationService from '../../services/LocationService';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const CLASS_OPTIONS = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SUBJECT_OPTIONS = ['Math','Physics','Chemistry','Biology','History','Geography','English','Bengali','Hindi','Computer Science'];

const formatDateDisplay = d =>
  d ? d.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : '';

const formatTimeDisplay = d =>
  d ? d.toLocaleTimeString('en-IN', {hour: 'numeric', minute: '2-digit', hour12: true}) : '';

const EditBatchScreen = ({route, navigation}) => {
  const {batch} = route.params;
  const [batchName, setBatchName] = useState(batch.batchName || '');
  const [selectedClass, setSelectedClass] = useState(batch.forClass || '');
  const [selectedSubjects, setSelectedSubjects] = useState(batch.subjects ? batch.subjects.split(',').map(s => s.trim()) : []);
  const [medium, setMedium] = useState(batch.medium || '');
  const [address, setAddress] = useState(batch.address || '');
  const [maxStudents, setMaxStudents] = useState(String(batch.maxStudents || 30));
  // Kept as Date-or-null: null means "unchanged", so we fall back to the
  // batch's existing startDate/startTime string when saving.
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState(batch.days || []);
  const [price, setPrice] = useState(batch.price || '');
  const [loading, setLoading] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [location, setLocation] = useState(batch.location || null);
  const [locationLoading, setLocationLoading] = useState(false);

  const toggleDay = d => setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleSubject = s => setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      const result = await LocationService.getCurrentLocation();
      setLocation(result);
      Alert.alert(
        'Location Updated',
        result.source === 'gps'
          ? 'GPS location captured successfully.'
          : 'Approximate location captured using IP.',
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to get location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      setStartDate(selectedDate);
    }
    if (Platform.OS === 'android') setShowDatePicker(false);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedTime) {
      setStartTime(selectedTime);
    }
    if (Platform.OS === 'android') setShowTimePicker(false);
  };

  const handleSave = async () => {
    if (!batchName.trim()) return Alert.alert('Error', 'Batch name is required');
    if (!selectedClass) return Alert.alert('Error', 'Please select a class');
    if (selectedSubjects.length === 0) return Alert.alert('Error', 'Select at least one subject');
    if (!address.trim()) return Alert.alert('Error', 'Address is required');

    setLoading(true);
    try {
      await updateBatch(batch.id, {
        batchName: batchName.trim(),
        forClass: selectedClass,
        subjects: selectedSubjects.join(', '),
        medium: medium.trim(),
        address: address.trim(),
        maxStudents: parseInt(maxStudents, 10) || 30,
        startDate: startDate ? formatDateDisplay(startDate) : (batch.startDate || ''),
        startTime: startTime ? formatTimeDisplay(startTime) : (batch.startTime || ''),
        days: selectedDays,
        price: price.trim(),
        ...(location && {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            source: location.source,
          },
        }),
        updatedAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Batch updated successfully!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Edit Batch</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveTopBtn}>
          <Text style={styles.saveTopText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Basic Information</Text>
            <CustomInput label="Batch Name *" placeholder="Batch name" value={batchName} onChangeText={setBatchName} iconName="class" autoCapitalize="words" />

            <Text style={styles.fieldLabel}>Class *</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowClassPicker(!showClassPicker)}>
              <Icon name="format-list-numbered" size={20} color={COLORS.textSecondary} style={{marginRight: 10}} />
              <Text style={[styles.selectText, !selectedClass && {color: COLORS.textSecondary}]}>
                {selectedClass || 'Select class'}
              </Text>
              <Icon name={showClassPicker ? 'expand-less' : 'expand-more'} size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
            {showClassPicker && (
              <View style={styles.dropdown}>
                {CLASS_OPTIONS.map(cls => (
                  <TouchableOpacity key={cls} style={[styles.dropdownItem, selectedClass === cls && styles.dropdownItemActive]}
                    onPress={() => {setSelectedClass(cls); setShowClassPicker(false);}}>
                    <Text style={[styles.dropdownText, selectedClass === cls && {color: COLORS.primary, fontWeight: '700'}]}>{cls}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.fieldLabel, {marginTop: 12}]}>Subjects *</Text>
            <View style={styles.chipsWrap}>
              {SUBJECT_OPTIONS.map(s => (
                <TouchableOpacity key={s} style={[styles.chip, selectedSubjects.includes(s) && styles.chipActive]}
                  onPress={() => toggleSubject(s)}>
                  <Text style={[styles.chipText, selectedSubjects.includes(s) && {color: COLORS.white}]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomInput label="Medium" placeholder="e.g. Bengali / English" value={medium} onChangeText={setMedium} iconName="language" style={{marginTop: 12}} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Location & Capacity</Text>
            <CustomInput label="Batch Address *" placeholder="Batch address" value={address} onChangeText={setAddress} iconName="place" autoCapitalize="words" />

            <Text style={styles.fieldLabel}>Batch Location</Text>
            <CustomButton
              title={
                locationLoading
                  ? 'Getting Location...'
                  : location
                  ? 'Update Location'
                  : 'Use Current Location'
              }
              iconName="my-location"
              onPress={handleGetLocation}
              loading={locationLoading}
            />
            {location && (
              <Text style={{color: 'green', fontWeight: '600', marginTop: 8, marginBottom: 4}}>
                ✓ {location.source === 'gps' ? 'GPS Location Captured' : 'Approximate Location Captured'}
              </Text>
            )}

            <CustomInput label="Maximum Students" placeholder="30" value={maxStudents} onChangeText={setMaxStudents} iconName="people" keyboardType="numeric" style={{marginTop: 8}} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Schedule & Pricing</Text>

            <Text style={styles.fieldLabel}>Start Date</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowDatePicker(true)}>
              <Icon name="event" size={20} color={COLORS.textSecondary} style={{marginRight: 10}} />
              <Text style={styles.selectText}>
                {startDate ? formatDateDisplay(startDate) : (batch.startDate || 'Select start date')}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}

            <Text style={[styles.fieldLabel, {marginTop: 12}]}>Start Time</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowTimePicker(true)}>
              <Icon name="schedule" size={20} color={COLORS.textSecondary} style={{marginRight: 10}} />
              <Text style={styles.selectText}>
                {startTime ? formatTimeDisplay(startTime) : (batch.startTime || 'Select start time')}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={startTime || new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            <Text style={[styles.fieldLabel, {marginTop: 12}]}>Days per Week</Text>
            <View style={styles.daysRow}>
              {DAYS.map(day => (
                <TouchableOpacity key={day} style={[styles.dayBtn, selectedDays.includes(day) && styles.dayBtnActive]} onPress={() => toggleDay(day)}>
                  <Text style={[styles.dayText, selectedDays.includes(day) && {color: COLORS.white}]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomInput label="Price per Month (₹)" placeholder="e.g. 500" value={price} onChangeText={setPrice} iconName="currency-rupee" keyboardType="numeric" style={{marginTop: 8}} />
          </View>

          <View style={styles.section}>
            <CustomButton title="Save Changes" onPress={handleSave} loading={loading} iconName="save" iconRight />
            <CustomButton title="Cancel" onPress={() => navigation.goBack()} variant="outline" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.surface, elevation: 2, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  backBtn: {padding: 4},
  pageTitle: {fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text},
  saveTopBtn: {backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10},
  saveTopText: {color: COLORS.white, fontWeight: '700', fontSize: SIZES.sm},
  container: {paddingVertical: 16, paddingHorizontal: 16, paddingBottom: 40},
  section: {backgroundColor: COLORS.surface, borderRadius: 18, padding: 18, marginBottom: 14, elevation: 1},
  sectionTitle: {fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 16},
  fieldLabel: {fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 8},
  selectBtn: {flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 4},
  selectText: {flex: 1, fontSize: SIZES.md, color: COLORS.text},
  dropdown: {backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, overflow: 'hidden', elevation: 4, maxHeight: 180},
  dropdownItem: {paddingHorizontal: 16, paddingVertical: 12},
  dropdownItemActive: {backgroundColor: COLORS.primaryLight},
  dropdownText: {fontSize: SIZES.md, color: COLORS.text},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background},
  chipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  chipText: {fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text},
  daysRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8},
  dayBtn: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background},
  dayBtnActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  dayText: {fontWeight: '600', color: COLORS.text, fontSize: SIZES.sm},
});

export default EditBatchScreen;
