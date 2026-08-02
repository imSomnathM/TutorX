// src/screens/tutor/TutorBatchesScreen.js
import React, {useEffect, useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
   StatusBar, Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import BottomNavBar from '../../components/BottomNavBar';
import {getTutorBatches, deleteBatch} from '../../firebase/firestore';
import {useAuth} from '../../context/AuthContext';

const TutorBatchesScreen = ({navigation}) => {
  const {user} = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    if (!user) return;
    const snap = await getTutorBatches(user.uid);
    setBatches(snap.docs.map(d => ({id: d.id, ...d.data()})));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchBatches);
    return unsub;
  }, [navigation, fetchBatches]);

  const handleDelete = (batchId, batchName) => {
    Alert.alert('Delete Batch', `Delete "${batchName}"? This cannot be undone.`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteBatch(batchId);
        fetchBatches();
      }},
    ]);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <Icon name="class" size={52} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Batches Yet!</Text>
      <Text style={styles.emptyDesc}>
        It looks like you haven't created any groups and classes. Batches allow you to teach multiple students simultaneously.
      </Text>
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('CreateBatch')}
        activeOpacity={0.85}>
        <Icon name="add" size={20} color={COLORS.white} />
        <Text style={styles.createBtnText}>Create Your First Batch</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Batches</Text>
          <Text style={styles.subtitle}>
            {batches.length > 0
              ? `${batches.length} batch${batches.length > 1 ? 'es' : ''} active`
              : 'Manage your groups and classes'}
          </Text>
        </View>
        {batches.length > 0 && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateBatch')}>
            <Icon name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={batches}
        keyExtractor={item => item.id}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={[styles.list, batches.length === 0 && {flex: 1}]}
        showsVerticalScrollIndicator={false}
        renderItem={({item}) => (
          <View style={styles.batchCard}>
            <View style={styles.batchHeader}>
              <View style={styles.batchIconBg}>
                <Icon name="menu-book" size={22} color={COLORS.primary} />
              </View>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.batchName}>{item.batchName}</Text>
                <Text style={styles.batchClass}>{item.forClass} • {item.subjects}</Text>
              </View>
              <View style={styles.studentCount}>
                <Text style={styles.countText}>{item.studentCount || 0}/{item.maxStudents || 30}</Text>
              </View>
            </View>

            <View style={styles.batchMeta}>
              <View style={styles.metaRow}>
                <Icon name="place" size={14} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{item.address}</Text>
              </View>
              {item.days?.length > 0 && (
                <View style={styles.metaRow}>
                  <Icon name="event" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{item.days.join(', ')}</Text>
                </View>
              )}
              {item.price && (
                <View style={styles.metaRow}>
                  <Icon name="currency-rupee" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>₹{item.price}/month</Text>
                </View>
              )}
            </View>

            <View style={styles.batchActions}>
              <TouchableOpacity
                style={[styles.actionBtn, {backgroundColor: COLORS.primaryLight}]}
                onPress={() => navigation.navigate('ManageStudents', {batchId: item.id})}>
                <Icon name="people" size={16} color={COLORS.primary} />
                <Text style={[styles.actionText, {color: COLORS.primary}]}>Manage Students</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() => navigation.navigate('EditBatch', {batch: item})}>
                <Icon name="edit" size={16} color={COLORS.white} />
                <Text style={[styles.actionText, {color: COLORS.white}]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.batchName)}>
                <Icon name="delete-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <BottomNavBar activeRoute="Batches" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  title: {fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text},
  subtitle: {fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2},
  addBtn: {width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 4},
  list: {padding: 16, paddingTop: 0},
  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32},
  emptyIconBg: {width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20},
  emptyTitle: {fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 10},
  emptyDesc: {color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28, fontSize: SIZES.sm},
  createBtn: {flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, alignItems: 'center', gap: 8, elevation: 4},
  createBtnText: {color: COLORS.white, fontWeight: '700', fontSize: SIZES.base},
  batchCard: {backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.07, shadowRadius: 6},
  batchHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  batchIconBg: {width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center'},
  batchName: {fontSize: SIZES.base, fontWeight: '700', color: COLORS.text},
  batchClass: {fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2},
  studentCount: {backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8},
  countText: {fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '700'},
  batchMeta: {gap: 6, marginBottom: 14, paddingLeft: 4},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  metaText: {fontSize: SIZES.xs, color: COLORS.textSecondary},
  batchActions: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  actionBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flex: 1, justifyContent: 'center'},
  editBtn: {backgroundColor: COLORS.primary},
  deleteBtn: {padding: 8},
  actionText: {fontSize: SIZES.xs, fontWeight: '600'},
});

export default TutorBatchesScreen;
